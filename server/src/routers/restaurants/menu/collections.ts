import { Router } from "express";
import { ObjectId } from "mongodb";
import sharp from "sharp";
import { Locals } from "../../../models/general.js";
import { Collection } from "../../../models/restaurant.js";
import { bufferFromString } from "../../../utils/bufferFromString.js";
import { getDishes } from "../../../utils/dishes.js";
import { id } from "../../../utils/id.js";
import { logged } from "../../../utils/middleware/auth.js";
import { restaurantWorker } from "../../../utils/middleware/restaurant.js";
import { updateRestaurant } from "../../../utils/restaurant.js";



const router = Router({ mergeParams: true });


router.get("/", logged(), restaurantWorker({ collections: 1, folders: 1, }, { dishes: { available: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;

    const result = [];

    for(const folder of restaurant.folders) {

        const getCollections = () => {
            const result = [];
            for(const fc of folder.collections) {
                for(const c of restaurant.collections) {
                    if(fc.equals(c._id)) {
                        result.push({...c, image: c.image?.buffer});
                        break;
                    }
                }
            }
            return result;
        }

        const collections = getCollections();
    
        

        result.push({
            ...folder,
            collections,
        });
    }

    
    res.send(result);
});
router.post("/", logged(), restaurantWorker({ collections: 1, }, { collections: { adding: true } }), async (req, res) => {
    const { name, description, dishes, image } = req.body;
    const { user, restaurant } = res.locals as Locals;

    if(!name) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(typeof name != "string" || (description && typeof description != "string")) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    const dishesIds = [];

    if(dishes) {
        for(let dish of dishes) {
            if(dish && dish._id) {
                dishesIds.push(id(dish._id));
            }
        }
    }

    
    const newCollection: Collection = {
        name: name.trim(),
        description: description?.trim() || null!,
        dishes: dishesIds,
        _id: id(),
        id: name.replace(/[^\w\s]/gi, "").replace(/\s/g, "-").toLowerCase(),
    }

    if(image) {
        const convertedImage = await sharp(bufferFromString(image)).resize(1000, 1000, { fit: "cover" }).jpeg().toBuffer();

        newCollection.image = {
            buffer: convertedImage,
            userId: user._id,
        }

    }
    
    for(let collection of restaurant.collections) {
        if(collection.id == newCollection.id) {
            return res.status(403).send({ reason: "NameTaken" });
        }
    }


    const update = await updateRestaurant(
        { _id: restaurant._id },
        { $push: {
            collections: { $each: [newCollection], $position: 0 },
            "folders.$[other].collections": newCollection._id
        } },
        { arrayFilters: [ { "other.id": "other" } ], projection: { _id: 1 } }
    );


    res.send({ updated: update.ok == 1 });
});
router.put("/:collectionId", logged(), restaurantWorker({}, { collections: { adding: true } }), async (req, res) => {
    const { name, description, dishes, image } = req.body;
    const { restaurant, user } = res.locals as Locals;
    const { collectionId } = req.params; // object id is used here

    if(!name || (description && typeof description != "string") || !dishes) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(typeof name != "string" || (description && typeof description != "string") || !Array.isArray(dishes) || (image && typeof image != "string")) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    const ids: ObjectId[] = [];

    for(const dish of dishes) {
        if(dish._id) {
            ids.push(id(dish._id));
        }
    }

    const update: any = {
        $set: {
            "collections.$[collection].dishes": ids,
            "collections.$[collection].name": name,
            "collections.$[collection].description": description,
            "collections.$[collection].id": name.replace(/[^\w\s]/gi, "").replace(/\s/g, "-").toLowerCase()
        }
    };
    
    if(image) {
        update.$set["collections.$[collection].image"] = { buffer: bufferFromString(image), userId: user._id };
    }

    const result = await updateRestaurant({ _id: restaurant._id }, update, { arrayFilters: [ { "collection.id": collectionId } ], projection: { _id: 1 } });


    res.send({ updated: result.ok == 1, id: name.replace(/[^\w\s]/gi, "").replace(/\s/g, "-").toLowerCase() });
});
router.get("/dishes-to-select", logged(), restaurantWorker({}, { collections: { adding: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;


    const dishes = await getDishes(restaurant._id, { }, { projection: { info: { name: 1, }, _id: 1, id: 1, library: { preview: 1, } } }).toArray();

    const result = [];

    for(let dish of dishes) {
        result.push({
            name: dish.info.name,
            image: dish.library?.preview,
            id: dish.id,
            _id: dish._id,
        })
    }

    
    res.send(result);
});
router.get("/:collectionId", logged(), restaurantWorker({ collections: 1 }, { collections: { available: true } }), async (req, res) => {
    const { collectionId } = req.params; // converted name id is used here
    const { restaurant } = res.locals as Locals;


    if(!restaurant.collections || restaurant.collections.length == 0) {
        return res.status(404).send({ reason: "CollectionsNotFound" });
    }


    let collection: Collection = null!;

    for(let c of restaurant.collections) {
        if(c.id == collectionId) {
            collection = c;
            break;
        }
    }

    if(!collection) {
        return res.status(404).send({ reason: "CollectionNotFound" });
    }

    
    const dishes = await getDishes(restaurant._id, { _id: { $in: collection.dishes } }, { projection: { info: { name: 1, }, _id: 1, id: 1, library: { preview: 1 } } }).toArray();

    const convertedDishes: {
        name: string;
        id: string;
        image: any;
        _id: ObjectId;
    }[] = [];

    for(let dish of dishes) {
        for(let id of collection.dishes) {
            if(dish._id.equals(id)) {
                convertedDishes.push({
                    name: dish.info.name,
                    id: dish.id,
                    image: dish.library?.preview,
                    _id: dish._id,
                });
                break;
            }
        }
    }


    const result = {
        collection: {
            name: collection.name,
            id: collection.id,
            description: collection.description,
            image: collection.image?.buffer,
        },
        dishes: convertedDishes,
    };



    res.send(result);
});






export {
    router as CollectionsRouter
}