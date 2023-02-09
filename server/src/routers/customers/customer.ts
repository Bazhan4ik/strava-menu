import { Router } from "express";
import { ObjectId } from "mongodb";
import { DEFAULT_COLLECTIONS_IDS } from "../../../resources/data/collections.js";
import { Locals } from "../../models/general.js";
import { Collection } from "../../models/restaurant.js";
import { getDish, getDishes } from "../../utils/dishes.js";
import { customerSession } from "../../utils/middleware/customerSession.js";
import { customerRestaurant } from "../../utils/middleware/customRestaurant.js";
import { getSessions } from "../../utils/sessions.js";
import { SessionRouter } from "./session.js";




const projections = {
    customerDishes: {
        id: 1,
        _id: 1,
        info: {
            name: 1,
            price: 1,
        },
        library: 1,
    },
    customerDish: {
        id: 1,
        info: {
            name: 1,
            price: 1,
            description: 1,
        },
        library: 1,
    }
}




const router = Router({ mergeParams: true });


router.use("/session", SessionRouter);


router.get("/locations", customerRestaurant({ locations: 1, info: { name: 1, id: 1, } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;



    if(!restaurant.locations || restaurant.locations.length == 0) {
        return res.status(403).send({ reason: "NoLocations" });
    }

    const locations = [];

    for(let location of restaurant.locations!) {
        locations.push({
            name: location.name,
            addressLine1: location.line1,
            addressLine2: location.line2,
            city: location.city,
            id: location.id,
        });
    }


    res.send({
        locations,
        restaurant: {
            name: restaurant.info.name,
            id: restaurant.info.id
        }
    });
});

router.get("/recommendations", customerRestaurant({ _id: 1, collections: 1 }), customerSession({}, {}), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;


    const dishes = await getDishes(restaurant._id, { }, { projection: projections.customerDishes }).toArray();

    const convertedDishes = new Map<string, { price: number; _id: ObjectId; name: string; id: string; image: any; }>();
    for(let dish of dishes) {
        convertedDishes.set(dish._id.toString(), {
            name: dish.info.name,
            price: dish.info.price,
            id: dish.id,
            image: dish.library?.list[0],
            _id: dish._id,
        });
    }

    const filterDishes = (ids: ObjectId[]) => {
        const result = [];
        for(let id of ids) {
            result.push(convertedDishes.get(id.toString())!);
        }
        return result;
    }


    const collections: {
        title: string;
        dishes: { price: number; name: string; id: string; image: any; }[];
        id: string;
        redirectable: boolean;
    }[] = [ ];

    for(let collection of restaurant.collections) {
        if(!DEFAULT_COLLECTIONS_IDS.includes(collection.id)) {
            collections.push({
                title: collection.name,
                id: collection.id,
                redirectable: collection.dishes.length > 5,
                dishes: filterDishes(collection.dishes),
            });
        }
    }

    const result: any = {
        collections,
    }

    if(user) {
        const sessions = await getSessions(
            restaurant._id,
            { "customer.customerId": user._id, status: "progress" },
            { projection: { dishes: { dishId: 1, status: 1, _id: 1 } } }
        ).toArray();

        result.tracking = [];
        
        for(let session of sessions) {
            for(let dish of session.dishes) {
                const d = convertedDishes.get(dish.dishId.toString());
                result.tracking.push({
                    status: dish.status,
                    name: d?.name,
                    image: d?.image?.buffer,
                    _id: dish._id,
                });
            }
        }
    }


    res.send(result);
});

router.get("/dishes/:dishId", customerRestaurant({ collections: 1, }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { dishId } = req.params;
    const { c } = req.query;

    const dish = await getDish(restaurant._id, { id: dishId }, { projection: projections.customerDish });

    if(!dish) {
        return res.status(404).send({ reason: "DishNotFound" });
    }

    const result: any = {
        dish: {
            name: dish.info.name,
            price: dish.info.price,
            description: dish.info.description,
            images: dish.library.list,
            _id: dish._id,
        }
    }
    
    if(c && typeof c == "string") {
        let collection: Collection = null!;

        

        for(let coll of restaurant.collections) {
            if(coll.id == c) {
                collection = coll;
                break;
            }
        }

        if(collection) {
            const dishes = await getDishes(restaurant._id, { _id: { $in: collection.dishes, $ne: dish._id, } }, { projection: projections.customerDishes }).toArray();

            const convertedDishes = [];

            for(let dish of dishes) {
                if(convertedDishes.length == 5) {
                    break;
                }
                convertedDishes.push({
                    name: dish.info.name,
                    price: dish.info.price,
                    id: dish.id,
                    image: dish.library?.list[0],
                    _id: dish._id,
                });
            }

            result.collection = {
                dishes: convertedDishes,
                title: collection.name,
                id: collection.id,
                redirectable: dishes.length > 5
            };
        }
        
    }


    


    res.send(result);
});

router.get("/tracking", customerRestaurant({ }), customerSession({}, {}), async (req, res) => {
    const { user, restaurant } = res.locals as Locals;

    if(!user) {
        return res.status(403).send({ reason: "Unauthorized" });
    }

    const sessions = await getSessions(
        restaurant._id,
        { "customer.customerId": user._id, status: "progress" },
        { projection: { dishes: { dishId: 1, status: 1, _id: 1 } } }
    ).toArray();

    if(!sessions || sessions.length == 0) {
        return res.send([]);
    }

    const getIds = () => {
        const result = [];
        for(let session of sessions) {
            for(let dish of session.dishes) {
                result.push(dish.dishId);
            }
        }
        return result;
    };

    const dishes = await getDishes(restaurant._id, { _id: { $in: getIds() } }, { projection: { info: { name: 1 }, library: { list: 1 } } }).toArray();

    const getMap = () => {
        const result = new Map<string, { name: string; image: any }>();
        for(let dish of dishes) {
            result.set(dish._id.toString(), { name: dish.info.name, image: dish.library.list[0] });
        }
        return result;
    }

    const map = getMap();

    const result = [];
    
    for(let session of sessions) {
        for(let dish of session.dishes) {
            const d = map.get(dish.dishId.toString());
            result.push({
                status: dish.status,
                name: d?.name,
                image: d?.image,
                _id: dish._id,
            });
        }
    }


    res.send(result);
});




export {
    router as CustomerRouter,
}