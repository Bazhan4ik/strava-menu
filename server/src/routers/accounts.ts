import { Router } from "express";
import { ObjectId } from "mongodb";
import { Restaurant } from "../models/restaurant.js";
import { User } from "../models/user.js";
import { createJWT, logged } from "../utils/middleware/auth.js";
import { isValidEmail, sendEmail } from "../utils/email.js";
import { id } from "../utils/id.js";
import { comparePasswords, encryptPassword } from "../utils/password.js";
import { createRestaurant, getRestaurants } from "../utils/restaurant.js";
import { addUser, getUser, updateUser } from "../utils/users.js";
import { Locals } from "../models/general.js";
import { DEFAULT_COLLECTIONS } from "../../resources/data/collections.js";
import { stripe } from "../setup/stripe.js";
import { getEmptyIngredientsUsage } from "../utils/ingredients.js";


const router = Router();




router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(typeof email != "string" || typeof password != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    if(!isValidEmail(email)) {
        return res.status(422).send({ reason: "InvalidEmail" });
    }


    const user = await getUser({ "info.email": email }, { projection: { info: { password: 1 } } });

    if(!user) {
        return res.status(403).send({ reason: "IncorrectData" });
    }

    if(!comparePasswords(user.info?.password!, password)) {
        return res.status(403).send({ reason: "IncorrectData" });
    }


    const token = createJWT({ expires: Date.now() + 86_400_000, userId: user._id.toString() });

    res.send({ token, expires: Date.now() + 86_400_000 });
});

router.post("/create", async (req, res) => {
    const { user } = req.body;

    if(!user) {
        return res.status(400).send({ reason: "UserNotProvided" });
    }

    if(!user.name || !user.name.first || !user.name.last || !user.password || !user.email) {
        return res.status(422).send({ reason: "InvalidUser" });
    }

    if(typeof user.name.first != "string" || typeof user.name.last != "string" || typeof user.password != "string" || typeof user.email != "string") {
        return res.status(422).send({ reason: "InvalidTypes" });
    }

    if(!isValidEmail(user.email)) {
        return res.status(422).send({ reason: "InvalidEmail" });
    }

    const exists = await getUser({ "info.email": user.email }, { projection: { _id: 1 } });

    if(exists) {
        return res.status(409).send({ reason: "EmailRegistered" });
    }


    const securityCode = Math.floor(100000 + Math.random() * 900000);

    const newUser: User = {
        _id: id(),

        status: "restricted",

        restaurants: [],

        info: {
            created: Date.now(),

            name: {
                first: user.name.first,
                last: user.name.last,
            },

            email: user.email,
            
            password: encryptPassword(user.password),
        },

        security: {
            code: securityCode.toString(),
            codeAsked: Date.now(),
        }
    };


    const result = await addUser(newUser);


    sendEmail(user.email, "Welcome to StravaMenu!", 
`
To confirm your account, please, enter the code below on stravamenu.com confirmation webpage.
${ securityCode }

`
    );



    const expires = Date.now() + 86400000;


    const JWT = createJWT({ expires, userId: newUser._id.toString() });



    res.send({ name: user.name, token: JWT, expires, });
});


router.post("/email-verification", logged({ security: { code: 1, } }), async (req, res) => {
    const { code } = req.body;
    const { user } = res.locals as Locals;


    if(!code) {
        return res.status(400).send({ reason: "CodeNotProvided" });
    }

    if(typeof code != "string" || code.length != 6) {
        return res.status(422).send({ reason: "InvalidCode" });
    }



    if(!user.security) {
        return res.status(500).send({ reason: "Unknown" });
    }

    if(!user.security.code) {
        return res.status(400).send({ reason: "NoCode" });
    }


    if(user.security.code != code) {
        return res.status(403).send({ reason: "IncorrectCode" });
    }

    const result = await updateUser({ _id: id(user._id) }, { $set: { status: "enabled", "security.code": null, "security.codeAsked": null, } }, { projection: { _id: 1 } });

    res.send({ updated: result.ok == 1 });
});



router.get("/email-verification", logged({ security: 1, info: { email: 1, }, status: 1 }), async (req, res) => {
    const { user } = res.locals as Locals;

    if(!user.security) {
        return res.status(500).send({ reason: "Unknown" });
    }

    if(!user.security.code) {

        if(user.status != "restricted") {
            return res.send(null);
        }

        const securityCode = Math.floor(100000 + Math.random() * 900000);

        sendEmail(user?.info?.email!, "Welcome to StravaMenu!", 
`
To confirm your account, please, enter the code below on stravamenu.com confirmation webpage.
${ securityCode }

`
        );

        const update = await updateUser({ _id: user._id }, { $set: { "security.code": securityCode, "security.codeAsked": Date.now() } }, { projection: { _id: 1 } });

        user.security.codeAsked = Date.now();
    }

    const date = Intl.DateTimeFormat("en-US", { day: "2-digit", hour: "2-digit", month: "long" }).format(user.security?.codeAsked);

    res.send({ date });
});



router.get("/", logged({  avatar: 1, info: { name: 1 }, restaurants: 1 }), async (req, res) => {
    const { user } = res.locals as Locals;

    if(!user.info) {
        return res.sendStatus(404);
    }



    const ids: ObjectId[] = [];
    for(let restaurant of user.restaurants) {
        ids.push(restaurant.restaurantId);
    }

    const restaurants = await getRestaurants({ _id: { $in: ids } }, { projection: { info: { name: 1, id: 1 }, } });

    const parsedRestaurants = [];
    for(let index = 0; index < user.restaurants.length; index++) {
        parsedRestaurants.push({
            name: restaurants[index].info.name,
            redirectTo: user.restaurants[index].redirectTo,
            id: restaurants[index].info.id,
        });
    }

    
    res.send({
        name: user.info.name,
        avatar: user.avatar?.buffer,
        restaurants: parsedRestaurants,
    });
});


router.post("/add-restaurant", logged({ _id: 1, status: 1, info: { email: 1, } }), async (req, res) => {
    const { user } = res.locals as Locals;
    const { name } = req.body;

    if(!name) {
        return res.status(400).send({ reason: "NameNotProvided" });
    }
    if(typeof name != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }
    if(user.status != "enabled") {
        return res.status(403).send({ reason: "AccountNotVerified" });
    }


    const parsedName = name.replace(/[^\w\s]/gi, "").replace(/\s/g, "-").toLowerCase();

    const newRestaurant: Restaurant = {
        _id: id(),
        info: {
            owner: user._id,
            id: parsedName,
            name: name,
            created: Date.now(),
        },
        ingredients: {
            current: getEmptyIngredientsUsage(),
            history: [],
            prices:  [],
        },
        locations: [],
        customers: [],
        tables: {},
        collections: [
            ...DEFAULT_COLLECTIONS,
        ],
        stripe: {},
        staff: [{ userId: user._id, locations: [], settings: { isOwner: true }, joined: Date.now(), }]
    }


    const account = await stripe.accounts.create({
        type: "custom",
        business_type: "individual",
        metadata: {
            userId: user._id.toString(),
            restaurantId: newRestaurant._id.toString(),
        },
        email: user.info?.email,
        capabilities: {
            card_payments: {
                requested: true,
            },
            transfers: {
                requested: true,
            },
        },
        country: "CA",
        tos_acceptance: {
            ip: req.ip,
            date: Math.floor(Date.now() / 1000),
        },
    });

    newRestaurant.stripe!.stripeAccountId = account.id;

    const result = await createRestaurant(newRestaurant);


    res.send({ added: result });

});


export {
    router as AccountsRouter
}




