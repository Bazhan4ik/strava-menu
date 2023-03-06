import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { Collection } from "../../models/restaurant.js";
import { Session } from "../../models/session.js";
import { getDish, getDishes } from "../../utils/dishes.js";
import { id } from "../../utils/id.js";
import { customerSession } from "../../utils/middleware/customerSession.js";
import { customerRestaurant } from "../../utils/middleware/customerRestaurant.js";
import { getSessions } from "../../utils/sessions.js";
import { SessionRouter } from "./session.js";




const projections = {
    collections: {
        goodQuality: {
            id: 1,
            _id: 1,
            info: {
                name: 1,
                price: 1,
            },
            library: { original: 1 },
        },
        badQuality: {
            id: 1,
            _id: 1,
            info: {
                name: 1,
                price: 1,
            },
            library: { blur: 1 },
        },
        noImage: {
            id: 1,
            _id: 1,
            info: {
                name: 1,
                price: 1,
            },
            library: { modified: 1 },
        }
    },
    customerDish: {
        id: 1,
        info: {
            name: 1,
            price: 1,
            description: 1,
        },
    },
}




const router = Router({ mergeParams: true });


router.use("/session", SessionRouter);


router.get("/locations", customerRestaurant({ locations: 1, info: { name: 1, id: 1, } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;



    if (!restaurant.locations || restaurant.locations.length == 0) {
        return res.status(403).send({ reason: "NoLocations" });
    }

    const locations = [];

    for (let location of restaurant.locations!) {
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

router.get("/recommendations", customerRestaurant({ _id: 1, collections: 1, folders: 1, layout: 1, }), customerSession({}, {}), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;


    if(!restaurant.collections || !restaurant.layout || !restaurant.folders) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getCollection = (id: ObjectId) => {
        for(const collection of restaurant.collections) {
            if(collection._id.equals(id)) {
                return collection;
            }
        }
        return null;
    }
    const getFolder = (id: ObjectId) => {
        for(const folder of restaurant.folders) {
            if(folder._id.equals(id)) {
                return folder;
            }
        }
        return null;
    }
    const getDish = (id: ObjectId) => {
        for(const dish of dishes) {
            if(dish._id.equals(id)) {
                return dish;
            }
        }
        return null!;
    }

    const dishesIds: ObjectId[] = [];


    const result: {
        tracking?: any[],
        elements: {
            type: "collection" | "folder";
            data: {
                name: string;
                dishes: ObjectId[];
            } | {
                name: string;
                collections: {
                    name: string;
                    id: string;
                    _id: ObjectId;
                    image: string;
                }[];
            }
        }[];
        dishes?: { [dishId: string]: any }[];
    } = {
        elements: [],
    }
    
    for(const element of restaurant.layout) {
        if(!element.data?.id) {
            continue;
        }

        if(element.type == "collection") {
            const collection = getCollection(element.data.id);

            
            if(!collection) {
                continue;
            }

            if(collection.dishes.length == 0) {
                continue;
            }
            
            dishesIds.push(...collection.dishes);

            result.elements.push({
                type: "collection",
                data: {
                    name: collection.name,
                    dishes: collection.dishes,
                },
            });
        } else if(element.type == "folder") {
            const folder = getFolder(element.data.id);

            if(!folder) {
                continue;
            }

            if(folder.collections.length == 0) {
                continue;
            }

            const collections = [];
            for(const c of folder.collections) {
                const collection = getCollection(c);

                if(collection) {
                    collections.push({
                        name: collection.name,
                        image: collection.image?.buffer as any,
                        _id: collection._id,
                        id: collection.id
                    }); 
                }
            }

            result.elements.push({
                type: "folder",
                data: {
                    name: folder.name,
                    collections,
                }
            })

        }
    }

    let sessions: Session[] = null!;

    if (user) {
        sessions = await getSessions(
            restaurant._id,
            { "customer.customerId": user._id, status: "progress" },
            { projection: { dishes: { dishId: 1, status: 1, _id: 1 } } }
        ).toArray();

        result.tracking = [];

        for (let session of sessions.slice(0, 1)) {
            for (let dish of session.dishes.slice(0, 3)) {
                dishesIds.push(dish.dishId);
            }
        }
    }

    const dishes = await getDishes(
        restaurant._id,
        { _id: { $in: dishesIds } },
        { projection: projections.collections.noImage }
    ).toArray();

    if(sessions) {
        for (let session of sessions) {
            for (let dish of session.dishes.slice(0, 3)) {
                const d = getDish(dish.dishId);
                result.tracking!.push({
                    status: dish.status,
                    name: d?.info?.name,
                    _id: dish._id,
                    dishId: dish.dishId,
                });
            }
        }
    }

    const dishMap = new Map();
    for(const dish of dishes) {
        dishMap.set(dish._id.toString(), dish);
    }

    result.dishes = Object.fromEntries(dishMap.entries());

    res.send(result);
});

router.get("/dishes/:dishId", customerRestaurant({ collections: 1, }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { dishId } = req.params;
    const { c } = req.query;

    const dish = await getDish(restaurant._id, { id: dishId }, { projection: projections.customerDish });

    if (!dish) {
        return res.status(404).send({ reason: "DishNotFound" });
    }

    const result: any = {
        dish: {
            info: {
                name: dish.info.name,
                price: dish.info.price,
                description: dish.info.description,
            },
            _id: dish._id,
            id: dish.id,
        }
    }

    if (c && typeof c == "string") {
        let collection: Collection = null!;



        for (let coll of restaurant.collections) {
            if (coll.id == c) {
                collection = coll;
                break;
            }
        }

        // if (collection) {
        //     const dishes = await getDishes(restaurant._id, { _id: { $in: collection.dishes, $ne: dish._id, } }, { projection: projections.collections.badQuality }).toArray();

        //     const convertedDishes = [];

        //     for (let dish of dishes) {
        //         if (convertedDishes.length == 5) {
        //             break;
        //         }
        //         convertedDishes.push({
        //             name: dish.info.name,
        //             price: dish.info.price,
        //             id: dish.id,
        //             library: dish.library?.list[0],
        //             _id: dish._id,
        //         });
        //     }

        //     result.collection = {
        //         dishes: convertedDishes,
        //         title: collection.name,
        //         id: collection.id,
        //         redirectable: dishes.length > 5
        //     };
        // }

    }





    res.send(result);
});
router.get("/dishes/:dishId/image", async (req, res) => {
    const { restaurantId, dishId } = req.params as any;

    if(restaurantId.length != 24) {
        return res.sendStatus(400);
    }

    const dish = await getDish(id(restaurantId), { $or: [ { _id: id(dishId) }, { id: dishId } ] }, { projection: { library: { list: { $slice: 1 } } } });

    if(dish?.library?.original) {

        const buffer = dish.library.original.buffer;


        res.contentType('image/jpeg');
        res.send(buffer);

        // res.writeHead(200, {
        //     'Content-Type': 'image/png',
        //     'Content-Length': buffer.length
        // });

        // res.end(buffer, "binary");

        return;
    }

    res.send(null);
});


router.get("/collections/:collectionId", customerRestaurant({ collections: 1 }), async (req, res) => {
    const { collectionId } = req.params;
    const { restaurant } = res.locals as Locals;

    if(!restaurant.collections) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getCollection = () => {
        for(const collection of restaurant.collections) {
            if(collection.id == collectionId) {
                return collection;
            }
        }
        return null;
    }


    const collection = getCollection();

    if(!collection) {
        return res.status(404).send({ reason: "CollectionNotFound" });
    }


    const dishes = await getDishes(
        restaurant._id,
        { _id: { $in: collection.dishes } },
        { projection: projections.collections.noImage }
    ).toArray();

    const dishesMap = new Map();
    for(const dish of dishes) {
        dishesMap.set(dish._id.toString(), dish);
    }
    


    res.send({
        collection: {
            name: collection.name,
            _id: collection._id,
            id: collection.id,
            description: collection.description,
            dishes: collection.dishes,
        },
        dishes: Object.fromEntries(dishesMap.entries()),
    });
});


router.get("/tracking", customerRestaurant({}), customerSession({}, {}), async (req, res) => {
    const { user, restaurant, session } = res.locals as Locals;

    const sessions = await getSessions(
        restaurant._id,
        { "customer.customerId": user?._id, status: "progress" },
        { projection: { dishes: { dishId: 1, status: 1, _id: 1 } } }
    ).toArray();

    if (!sessions || sessions.length == 0) {
        return res.send({ logged: !!user, dishes: [] });
    }

    const getIds = () => {
        const result = [];
        for (let session of sessions) {
            for (let dish of session.dishes) {
                result.push(dish.dishId);
            }
        }
        return result;
    };

    const dishes = await getDishes(restaurant._id, { _id: { $in: getIds() } }, { projection: { info: { name: 1 }, library: { original: 1 } } }).toArray();

    const getMap = () => {
        const result = new Map<string, { name: string; image: any }>();
        for (let dish of dishes) {
            result.set(dish._id.toString(), { name: dish.info.name, image: dish.library?.original });
        }
        return result;
    }

    const map = getMap();

    const result = [];

    for (let session of sessions) {
        for (let dish of session.dishes) {
            const d = map.get(dish.dishId.toString());
            result.push({
                status: dish.status,
                name: d?.name,
                image: d?.image,
                _id: dish._id,
                dishId: dish.dishId,
            });
        }
    }


    res.send({
        dishes: result,
        logged: !!user,
    });
});




export {
    router as CustomerRouter,
}


