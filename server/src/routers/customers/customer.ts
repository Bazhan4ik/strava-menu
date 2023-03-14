import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { Collection } from "../../models/restaurant.js";
import { Session } from "../../models/session.js";
import { getDish, getDishes } from "../../utils/dishes.js";
import { id } from "../../utils/id.js";
import { customerSession } from "../../utils/middleware/customerSession.js";
import { customerRestaurant } from "../../utils/middleware/customerRestaurant.js";
import { getSession, getSessions } from "../../utils/sessions.js";
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
            status: 1,
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
        modifiers: 1,
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
                if(dish.status != "visible") {
                    return null!;
                }
                return dish;
            }
        }
        return null!;
    }
    const filterDishes = () => {
        for(let e = 0; e < result.elements.length; e++) {
            const element = result.elements[e];

            if(element.type == "folder") {

                const collections = (element.data as { collections: { name: string; _id: ObjectId; id: string; dishes: ObjectId[]; }[]; }).collections;

                for(let c = 0; c < collections.length; c++) {
                    for(let d in collections[c].dishes) {
                        if(!getDish(collections[c].dishes[d])) {
                            collections[c].dishes.splice(+d, 1);
                        }
                    }
                    if(collections[c].dishes.length == 0) {
                        collections.splice(+c, 1);
                        c -= 1;
                    }
                }
                
                continue;
            } else if(element.type == "dish") {
                const dish = getDish((element.data as any)._id);

                if(!dish) {
                    result.elements.splice(+e, 1);
                    e -= 1;
                    continue;
                }

                element.data = dish as any;
                continue;
            }

            const dishes = (element.data as { dishes: ObjectId[] }).dishes;

            for(let d in dishes) {
                if(!getDish(dishes[d])) {
                    dishes.splice(+d, 1);
                }
            }

            if(dishes.length == 0) {
                result.elements.splice(+e, 1);
                e -= 1;
            }
        }

        return result.elements;
    }

    const dishesIds: ObjectId[] = [];


    const result: {
        tracking?: any[],
        elements: {
            type: "collection" | "folder" | "dish";
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
                    dishes: ObjectId[];
                }[];
            } | {
                _id: string;
                id: string;
                info: {
                    name: string;
                    description: string;
                    price: number;
                }
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
                        id: collection.id,
                        dishes: collection.dishes,
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

        } else if(element.type == "dish") {
            result.elements.push({
                type: element.type,
                data: {
                    _id: element.data.id
                } as any
            });
            dishesIds.push(element.data.id);
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
        { _id: { $in: dishesIds }, status: "visible" },
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

    result.elements = filterDishes();

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
    if(!dish.modifiers) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getModifierSubtitle = (o: string, a: number) => {
        if(o == "less") {
            return `Up to ${a}`;
        } else if(o == "more") {
            return `At least ${a}`;
        } else if(o == "one") {
            return null!;
        } else if(o == "equal") {
            return `Choose ${a} options`;
        }
        return null!;
    }
    const getModifiers = () => {
        const result: {
            title: string;
            subtitle: string;

            _id: ObjectId;
            required: boolean;
            toSelect: number;
            toSelectAmount: string;
        
            options: {
                name: string;
                price: number;
                _id: ObjectId;
            }[];
        }[] = [];
        for(const modifier of dish.modifiers!) {
            result.push({
                toSelect: modifier.amountOfOptions,
                toSelectAmount: modifier.amountToSelect,
                subtitle: getModifierSubtitle(modifier.amountToSelect, modifier.amountOfOptions),
                options: modifier.options,
                required: modifier.required,
                _id: modifier._id,
                title: modifier.name,
            });
        }
        return result;
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
            modifiers: getModifiers()
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

router.get("/modifiers", customerRestaurant({ }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { sessionDishId, dishId } = req.query;

    if(typeof sessionDishId != "string" || sessionDishId.length != 24) {
        return res.status(400).send({ reason: "InvalidSessionDishId" });
    }
    if(typeof dishId != "string" || dishId.length != 24) {
        return res.status(400).send({ reason: "InvalidDishId" });
    }


    const session = await getSession(
        restaurant._id,
        { dishes: { $elemMatch: { _id: id(sessionDishId) } } },
        { projection: { dishes: { _id: 1, modifiers: 1 } } },
    );

    if(!session) {
        return res.status(404).send({ reason: "SesssionNotFound" });
    }

    const getModifierSubtitle = (o: string, a: number) => {
        if(o == "less") {
            return `Up to ${a}`;
        } else if(o == "more") {
            return `At least ${a}`;
        } else if(o == "one") {
            return null!;
        } else if(o == "equal") {
            return `Choose ${a} options`;
        }
        return null!;
    }
    const getSelectedModifiers = () => {
        for(const dish of session.dishes) {
            if(dish._id.equals(sessionDishId)) {
                return dish.modifiers || [];
            }
        }
        return null;
    }

    const modifiers = getSelectedModifiers();

    if(!modifiers) {
        return res.status(400).send({ reason: "ModifiersNotFound" });
    }

    if(modifiers.length == 0) {
        return res.send({ modifiers: [] });
    }

    const dish = await getDish(
        restaurant._id,
        { _id: id(dishId) },
        { projection: { modifiers: 1 } }
    );

    if(!dish) {
        return res.status(404).send({ reason: "DishNotFound" });
    }
    if(!dish.modifiers) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const result = [];

    for(const modifier of dish.modifiers) {
        let added = false;
        for(const dishModifier of modifiers) {
            if(dishModifier._id.equals(modifier._id)) {
                added = true;
                result.push({
                    toSelect: modifier.amountOfOptions,
                    toSelectAmount: modifier.amountToSelect,
                    subtitle: getModifierSubtitle(modifier.amountToSelect, modifier.amountOfOptions),
                    options: modifier.options,
                    required: modifier.required,
                    _id: modifier._id,
                    title: modifier.name,
                    selected: dishModifier.selected || [],
                });
            }   
        }
        if(!added) {
            result.push({
                toSelect: modifier.amountOfOptions,
                toSelectAmount: modifier.amountToSelect,
                subtitle: getModifierSubtitle(modifier.amountToSelect, modifier.amountOfOptions),
                options: modifier.options,
                required: modifier.required,
                _id: modifier._id,
                title: modifier.name,
                selected: [],
            });
        }
    }
    

    res.send({ selected: result, modifiers: dish.modifiers });
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
        { _id: { $in: collection.dishes }, status: "visible", },
        { projection: projections.collections.noImage }
    ).toArray();

    const dishesMap = new Map();
    for(const dish of dishes) {
        dishesMap.set(dish._id.toString(), dish);
    }

    for(const dishId in collection.dishes) {
        if(!dishesMap.has(collection.dishes[dishId].toString())) {
            collection.dishes.splice(+dishId, 1);
        }
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


