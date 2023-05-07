import { Router } from "express";
import { ObjectId } from "mongodb";
import sharp from "sharp";
import { Locals } from "../../../models/general.js";
import { Collection } from "../../../models/restaurant.js";
import { bufferFromString } from "../../../utils/other/bufferFromString.js";
import { getItems } from "../../../utils/data/items.js";
import { id } from "../../../utils/other/id.js";
import { logged } from "../../../middleware/auth.js";
import { restaurantWorker } from "../../../middleware/restaurant.js";
import { aggregateRestaurant, getRestaurant, updateRestaurant } from "../../../utils/data/restaurant.js";



const router = Router({ mergeParams: true });


router.get("/", logged(), restaurantWorker({ collections: 1, folders: 1, }, { items: { available: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;

    const getCollections = () => {
        const result = [];
        for(const collection of restaurant.collections) {
            result.push({...collection, hasImage: !!collection.image?.userId });
        }
        return result;
    }

    const collections = getCollections();

    res.send(collections);
});
router.post("/", logged(), restaurantWorker({ collections: 1, sorting: 1, }, { collections: { adding: true } }), async (req, res) => {
    const { name, description, items, image } = req.body;
    const { user, restaurant } = res.locals as Locals;

    if(!restaurant.sorting?.days || !restaurant.sorting.times) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(!name) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(typeof name != "string" || (description && typeof description != "string")) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    const itemsIds = [];

    if(items) {
        for(let item of items) {
            if(item && item._id) {
                itemsIds.push(id(item._id));
            }
        }
    }

    
    const newCollection: Collection = {
        name: name.trim(),
        description: description?.trim() || null!,
        items: itemsIds,
        _id: id(),
        id: name.replace(/[^\w\s]/gi, "").replace(/\s/g, "-").toLowerCase(),
    }

    if(image) {
        const convertedImage = await sharp(bufferFromString(image)).resize(1000, 1000, { fit: "cover" }).jpeg().toBuffer();

        newCollection.image = {
            buffer: convertedImage as any,
            userId: user._id,
        }

    }
    
    for(let collection of restaurant.collections) {
        if(collection.id == newCollection.id) {
            return res.status(403).send({ reason: "NameTaken" });
        }
    }


    const $push: any = {
        collections: { $each: [newCollection], $position: 0 },
        "folders.$[other].collections": newCollection._id,
    };
    for(const day of Object.keys(restaurant.sorting?.days)) {
        $push[`sorting.days.${day}.collections`] = newCollection._id;
    }
    for(const time of Object.keys(restaurant.sorting?.times)) {
        $push[`sorting.times.${time}.collections`] = newCollection._id;
    }


    const update = await updateRestaurant(
        { _id: restaurant._id },
        { $push },
        { arrayFilters: [ { "other.id": "other" } ], projection: { _id: 1 } }
    );


    res.send({ updated: update.ok == 1 });
});
router.put("/:collectionId", logged(), restaurantWorker({}, { collections: { adding: true } }), async (req, res) => {
    const { name, description, items, image } = req.body;
    const { restaurant, user } = res.locals as Locals;
    const { collectionId } = req.params; // object id is used here

    if(!name || (description && typeof description != "string") || !items) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(typeof name != "string" || (description && typeof description != "string") || !Array.isArray(items) || (image && typeof image != "string")) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    const ids: ObjectId[] = [];

    for(const item of items) {
        if(item._id) {
            ids.push(id(item._id));
        }
    }

    const update: any = {
        $set: {
            "collections.$[collection].items": ids,
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
router.get("/items-to-select", logged(), restaurantWorker({}, { collections: { adding: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;


    const items = await getItems(restaurant._id, { }, { projection: { info: { name: 1, }, _id: 1, id: 1, library: { preview: 1, } } }).toArray();

    const result = [];

    for(let item of items) {
        result.push({
            name: item.info.name,
            image: item.library?.preview,
            id: item.id,
            _id: item._id,
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

    
    const items = await getItems(restaurant._id, { _id: { $in: collection.items } }, { projection: { info: { name: 1, }, _id: 1, id: 1, library: { preview: 1 } } }).toArray();

    const convertedItems: {
        name: string;
        id: string;
        image: any;
        _id: ObjectId;
    }[] = [];

    for(let item of items) {
        for(let id of collection.items) {
            if(item._id.equals(id)) {
                convertedItems.push({
                    name: item.info.name,
                    id: item.id,
                    image: item.library?.preview,
                    _id: item._id,
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
        items: convertedItems,
    };



    res.send(result);
});
router.get("/:collectionId/image", async (req, res) => {
    const { collectionId, restaurantId } = req.params as any;

    const result = await aggregateRestaurant([
        { $match: { _id: id(restaurantId) } },
        { $unwind: "$collections" },
        { $match: { "collections.id": collectionId } },
        { $project: { "collectionImage": "$collections.image.buffer" } },
    ]).toArray();
    
    const restaurant = result[0];

    if(!restaurant) {
        return res.status(404).send({ reason: "RestaurantNotFound" });
    }

    if(!restaurant.collectionImage) {
        return res.send(null);
    }

    
    const image = restaurant.collectionImage;

    if(!image) {
        res.send(null);
    }

    res.set("Content-Type", "image/png");
    res.set("Content-Length", image?.buffer.length.toString());
    res.set("Cache-Control", "public, max-age=31536000");
    res.send(image?.buffer);
});




export {
    router as CollectionsRouter
}