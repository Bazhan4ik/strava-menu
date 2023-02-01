import { Router } from "express";
import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { Locals } from "../../models/general.js";
import { OrderDish, OrderType, TimelineComponent } from "../../models/session.js";
import { stripe } from "../../setup/stripe.js";
import { getDishes } from "../../utils/dishes.js";
import { id } from "../../utils/id.js";
import { customerSession } from "../../utils/middleware/customerSession.js";
import { customerRestaurant } from "../../utils/middleware/customRestaurant.js";
import { createSession, updateSession } from "../../utils/sessions.js";


const router = Router({ mergeParams: true });




router.get("/", customerRestaurant({ info: { name: 1, id : 1 } }), customerSession({ info: 1, dishes: { _id: 1, dishId: 1, info: 1 }, }, {}, false), async (req, res) => {
    const { restaurant, session, user } = res.locals as Locals;
    const { socketId, table } = req.params;

    const response: any = {
        restaurant: {
            name: restaurant?.info.name,
            id: restaurant?.info.id,
        },
    }

    if(!session) {
        
        const newSessionId = id();

        const newSession = await createSession(restaurant._id, {
            _id: newSessionId,
            customer: {
                by: "customer",
                customerId: user?._id || null!,
                socketId: socketId || null!,
            },
            timing: {
                connected: Date.now(),
            },
            timeline: [
                {
                    action: "created",
                    userId: "customer",
                    time: Date.now(),
                }
            ],
            info: {
                id: table && !isNaN(+table) ? table : null!,
                type: "dinein",
            },
            status: "ordering",
            dishes: [],
            waiterRequests: [],
        });

        response.session = {
            dishes: [],
            id: table && !isNaN(+table) ? table : null!,
            type: "dinein",
        };

        response.setSessionId = newSessionId;
    } else {
        response.session = {
            info: session.info,
            dishes: session.dishes.map(d => { return { dishId: d.dishId, _id: d._id, comment: d.info.comment } })
        }
    }

    console.log(response);

    res.send(response);
});

router.put("/comment", customerRestaurant({ }), customerSession({ info: { comment: 1 } }, { }), async (req, res) => {
    const { restaurant, session } = res.locals as Locals;
    let { comment } = req.body;

    if(!comment) {
        return res.status(400).send({ reason: "CommentNotProvided" });
    }
    if(typeof comment != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    if(comment == session.info.comment) {
        return res.send({ updated: true });
    }

    if(comment == "remove") {
        comment = null!;
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id, },
        { $set: { "info.comment": comment } },
        { projection: { _id: 1 } }
    );

    res.send({ updated: update.ok == 1 });
});

router.post("/dish", customerRestaurant({  }), customerSession({ }, { }), async (req, res) => {
    const { restaurant, session, user } = res.locals as Locals;
    const { dishId, comment } = req.body;

    if(!dishId) {
        return res.status(400).send({ reason: "DishIdNotProvided" });
    }

    if(typeof dishId != "string" || dishId.length != 24 || (comment && typeof comment != "string")) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    const newDish: OrderDish = {
        dishId: id(dishId),
        _id: id(),
        status: "ordered",
        info: {
            comment: comment || null!,
        },
    };

    const timeline: TimelineComponent = {
        action: "dish/add",
        userId: "customer",
        time: Date.now(),
        dishId: newDish._id,
    }

    const update = await updateSession(restaurant._id, { _id: session._id, }, { $push: { dishes: newDish }  }, { projection: { _id: 1, } });


    res.send({
        insertedId: newDish._id,
    });
});

router.put("/dish/:orderDishId/comment", customerRestaurant({ }), customerSession({ dishes: { _id: 1, info: { comment: 1 } } }, { }), async (req, res) => {
    const { orderDishId } = req.params;
    const { session, restaurant } = res.locals as Locals;
    let { comment } = req.body;

    if(!comment) {
        return res.status(400).send({ reason: "CommentNotProvided" });
    }

    if(typeof comment != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    for(let dish of session.dishes) {
        if(dish._id.equals(orderDishId)) {
            if(dish.info.comment == comment) {
                return res.send({ updated: true });
            }
        }
    }

    if(comment == "remove") {
        comment = null;
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "dishes.$[dish].info.comment": comment } },
        { arrayFilters: [ { "dish._id": id(orderDishId) } ] }
    );

    res.send({ updated: update.ok == 1 });
});

router.delete("/dish/:orderDishId", customerRestaurant({}), customerSession({ }, { }), async (req, res) => {
    const { orderDishId } = req.params;
    const { restaurant, session } = res.locals as Locals;

    if(!orderDishId || orderDishId.length != 24) {
        return res.status(400).send({ reason: "InvalidId" });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $pull: { "dishes": { _id: id(orderDishId) } } },
        { projection: { _id: 1 } }
    );

    res.send({
        updated: update.ok == 1,
    });
});


router.get("/preview", customerRestaurant({ }), customerSession({ dishes: 1, info: 1 }, { }), async (req, res) => {
    const { restaurant, session, user } = res.locals as Locals;

    const dishesId: ObjectId[] = [];


    for(let dish of session.dishes) {
        dishesId.push(dish.dishId);
    }

    const dishes = await getDishes(restaurant._id, { _id: { $in: dishesId } }, { projection: { info: { name: 1, price: 1, }, id: 1, library: { preview: 1, } } }).toArray();

    const convertedDishes = [];

    const findDish = (dishId: ObjectId) => {
        for(let dish of dishes) {
            if(dish._id.equals(dishId)) {
                return dish;
            }
        }
        return null!;
    }

    let subtotal = 0;

    for(let d of session.dishes) {
        const dish = findDish(d.dishId);

        if(!dish) {
            return res.status(500).send({ reason: "InvalidDishes" });
        }

        convertedDishes.push({
            name: dish.info.name,
            price: dish.info.price,
            image: dish.library.preview,
            dishId: dish.id,
            dishObjectId: dish._id,
            _id: d._id,
            comment: d.info.comment
        });

        subtotal += dish.info.price;

    }



    res.send({
        dishes: convertedDishes,
        subtotal,
        info: session.info,
    });
});



router.put("/type", customerRestaurant({ }), customerSession({ info: { type: 1, id: 1, } }, { }), async (req, res) => {
    const { restaurant, session, } = res.locals as Locals;
    const { type } = req.body;

    if(!type) {
        return res.status(400).send({ reason: "TypeNotProvided" });
    }
    if(typeof type != "string" || !["dinein", "takeout"].includes(type)) {
        return res.status(422).send({ reason: "InvalidInput" });
    }


    if(session.info.type == type) {
        return res.send({ updated: true, id: session.info.id });
    }

    let id = null;

    if(type == "takeout") {
        id = Math.floor(Math.random() * 9000 + 1000).toString();
    }

    const update = await updateSession(restaurant._id, { _id: session._id }, { $set: { "info.type": type as OrderType, "info.id": id! } }, { projection: { _id: 1 } });
    

    res.send({ updated: update.ok == 1, id });
});




router.get("/checkout", customerRestaurant({ }), customerSession({ dishes: { dishId: 1, _id: 1 }, payment: 1, }, { stripeCustomerId: 1 }), async (req, res) => {
    const { session, restaurant, user } = res.locals as Locals;

    if(!restaurant.stripe || !restaurant.stripe.stripeAccountId) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const result = await calculateAmount(restaurant._id, session.dishes);

    if(!result) {
        return res.status(500).send({ reason: "InvalidDishes" });
    }

    const paymentIntent = await createPaymentIntent(
        user?.stripeCustomerId,
        restaurant.stripe.stripeAccountId,
        result.money.total,
        session.payment?.paymentIntentId
    );

    if(paymentIntent) {
        const update = await updateSession(restaurant._id,
            { _id: session._id, },
            { $set: { "payment.paymentIntentId": paymentIntent.id } },
            { projection: { _id: 1 } }
        );
    }

    const { money, dishes } = result;


    



    res.send({
        money,
        dishes,
        clientSecret: paymentIntent.client_secret,
    });
});




export {
    router as SessionRouter
}





async function calculateAmount(restaurantId: ObjectId, ds: OrderDish[]) {
    const dishesId: ObjectId[] = [];


    for(let dish of ds) {
        dishesId.push(dish.dishId);
    }

    const dishes = await getDishes(restaurantId, { _id: { $in: dishesId } }, { projection: { info: { price: 1, name: 1, }, } }).toArray();

    const convertedDishes: {
        name: string;
        amount: string;
        price: number;
    }[] = [];

    
    const findDish = (dishId: ObjectId) => {
        for(let dish of dishes) {
            if(dish._id.equals(dishId)) {
                return dish;
            }
        }
        return null!;
    }
    
    let subtotal = 0;
    
    const map = new Map<string, { name: string; amount: number; price: number; }>();

    for(let d of ds) {
        const dish = findDish(d.dishId);

        if(!dish) {
            return null;
        }

        if(map.has(dish._id.toString())) {
            const entry = map.get(dish._id.toString())!;

            map.set(dish._id.toString(), { ...entry, price: entry.price + dish.info.price, amount: entry.amount + 1 });
        } else {
            map.set(dish._id.toString(), { name: dish.info.name, price: dish.info.price, amount: 1 });
        }
        


        subtotal += dish.info.price;
    }

    const hst = subtotal * 0.13;
    const total = hst + subtotal;


    return {
        money: {
            subtotal,
            hst,
            total,
        },
        dishes: Array.from(map.values()),
    };
}

async function createPaymentIntent(stripeCustomerId: string = undefined!, stripeAccountId: string, total: number, pid?: string) {
    if(pid) {
        const paymentIntent = await stripe.paymentIntents.update(pid, { amount: total });

        return paymentIntent;
    } else {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: total,
            on_behalf_of: stripeAccountId,
            currency: "cad",
            customer: stripeCustomerId,
        });

        return paymentIntent;
    }
}



async function a() {



    const paymentIntent = await stripe.paymentIntents.create({
        amount: 123,
        currency: "USD",
        metadata: {
            
        }
    })



}