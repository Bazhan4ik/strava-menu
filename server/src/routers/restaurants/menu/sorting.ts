import { Router } from "express";
import { ObjectId } from "mongodb";
import stringWidth from "string-width";
import { Locals } from "../../../models/general.js";
import { id } from "../../../utils/other/id.js";
import { getItem, getItems } from "../../../utils/data/items.js";
import { logged } from "../../../middleware/auth.js";
import { restaurantWorker } from "../../../middleware/restaurant.js";
import { updateRestaurant } from "../../../utils/data/restaurant.js";




const router = Router({ mergeParams: true });




router.get("/day", logged(), restaurantWorker({ sorting: { days: 1, }, collections: 1, }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { day } = req.query;

    if(!day || typeof day != "string" || isNaN(+day) || +day > 6 || +day < 0) {
        return res.status(400).send({ reason: "InvalidDay" });
    }
    
    if(!restaurant.sorting || !restaurant.sorting.days) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    if(!restaurant.collections) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    const items = await getItems(restaurant._id, { }, { projection: { library: { preview: 1 }, info: { name: 1, } } }).toArray();

    const findItems = (ids: ObjectId[]) => {
        const result = [];
        for(const id of ids) {
            for(const item of items) {
                if(id.equals(item._id)) {
                    result.push({ image: item.library?.preview, name: item.info.name, _id: item._id });
                    break;
                }
            }
        }
        return result;
    }
    const findCollections = (ids: ObjectId[]) => {
        const result = [];
        for(const id of ids) {
            for(const collection of restaurant.collections) {
                if(id.equals(collection._id)) {
                    result.push({ image: collection.image?.buffer, name: collection.name, _id: collection._id });
                    break;
                }
            }
        }
        return result;
    }

    const collections = findCollections(restaurant.sorting.days[+day as 0].collections);
    const itemsOnTheDay = findItems(restaurant.sorting.days[+day as 0].items);


    res.send({ items: itemsOnTheDay, collections });
});
router.put("/day/items", logged(), restaurantWorker({  }), async (req, res) => {
    const { day } = req.query;
    const { restaurant } = res.locals as Locals;
    const { items } = req.body;

    if(!day || typeof day != "string" || isNaN(+day) || +day < 0 || +day > 6) {
        return res.status(400).send({ reason: "InvalidDay" });
    }
    if(!Array.isArray(items)) {
        return res.status(422).send({ reason: "InvalidItems" });
    }


    const itemsIds: ObjectId[] = [];
    for(const itemId of items) {
        if(!itemId || typeof itemId != "string" || itemId.length != 24) {
            return res.status(422).send({ reason: "InvalidItems" });
        }
        itemsIds.push(id(itemId));
    }

    const allItems = await getItems(restaurant._id, { _id: { $in: itemsIds } }, { projection: { _id: 1 } }).toArray();
    if(allItems.length != allItems.length) {
        return res.status(400).send({ reason: "InvalidItems" });
    }


    const $set: any = {};
    $set[`sorting.days.${day}.items`] = itemsIds;



    const update = await updateRestaurant({ _id: restaurant._id, }, { $set }, { projection: { _id: 1 } });


    res.send({ updated: update.ok == 1 });
});
router.put("/day/items/remove", logged(), restaurantWorker({  }), async (req, res) => {
    const { day } = req.query;
    const { restaurant } = res.locals as Locals;
    const { itemId } = req.body;

    if(!day || typeof day != "string" || isNaN(+day) || +day < 0 || +day > 6) {
        return res.status(400).send({ reason: "InvalidDay" });
    }
    if(!itemId || typeof itemId != "string" || itemId.length != 24) {
        return res.status(422).send({ reason: "InvalidItemId" });
    }

    const item = await getItem(restaurant._id, { _id: id(itemId) }, { projection: { _id: 1 } });
    if(!item) {
        return res.status(404).send({ reason: "InvalidItem" });
    }

    const $pull: any = {};
    $pull[`sorting.days.${day}.items`] = item._id;

    const update = await updateRestaurant({ _id: restaurant._id }, { $pull }, { projection: { _id: 1 } });

    res.send({ updated: update.ok == 1 });
});
router.put("/day/collections", logged(), restaurantWorker({ collections: { _id: 1 } }), async (req, res) => {
    const { day } = req.query;
    const { restaurant } = res.locals as Locals;
    const { collections } = req.body;

    if(!day || typeof day != "string" || isNaN(+day) || +day < 0 || +day > 6) {
        return res.status(400).send({ reason: "InvalidDay" });
    }
    if(!Array.isArray(collections)) {
        return res.status(422).send({ reason: "InvalidCollections" });
    }
    if(!restaurant.collections) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    const findCollection = (id: string) => {
        for(const collection of restaurant.collections) {
            if(collection._id.equals(id)) {
                return true;
            }
        }
        return false;
    }


    const collectionsIds: ObjectId[] = [];
    for(const collectionId of collections) {
        if(!collectionId || typeof collectionId != "string" || collectionId.length != 24) {
            return res.status(422).send({ reason: "InvalidCollections" });
        }
        if(!findCollection(collectionId)) {
            return res.status(400).send({ reason: "InvalidCollections" });
        }
        collectionsIds.push(id(collectionId));
    }



    const $set: any = {};
    $set[`sorting.days.${day}.collections`] = collectionsIds;



    const update = await updateRestaurant({ _id: restaurant._id, }, { $set }, { projection: { _id: 1 } });


    res.send({ updated: update.ok == 1 });
});
router.put("/day/collections/remove", logged(), restaurantWorker({ collections: { _id: 1 } }), async (req, res) => {
    const { day } = req.query;
    const { restaurant } = res.locals as Locals;
    const { collectionId } = req.body;

    if(!day || typeof day != "string" || isNaN(+day) || +day < 0 || +day > 6) {
        return res.status(400).send({ reason: "InvalidDay" });
    }
    if(!collectionId || typeof collectionId != "string" || collectionId.length != 24) {
        return res.status(422).send({ reason: "InvalidCollectionId" });
    }
    
    const findCollection = (id: string) => {
        for(const collection of restaurant.collections) {
            if(collection._id.equals(id)) {
                return true;
            }
        }
        return false;
    }

    if(!findCollection(collectionId)) {
        return res.status(404).send({ reason: "CollectionNotFound" });
    }

    

    const $pull: any = {};
    $pull[`sorting.days.${day}.collections`] = id(collectionId);

    const update = await updateRestaurant({ _id: restaurant._id }, { $pull }, { projection: { _id: 1 } });

    res.send({ updated: update.ok == 1 });
});



router.get("/time", logged(), restaurantWorker({ sorting: { times: 1 }, collections: 1 }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { time } = req.query;

    if(!time || typeof time != "string" || !["morning", "afternoon", "evening", "night"].includes(time)) {
        return res.status(400).send({ reason: "InvalidTime" });
    }
    
    if(!restaurant.sorting || !restaurant.sorting.times) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    if(!restaurant.collections) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    const items = await getItems(restaurant._id, { }, { projection: { library: { preview: 1 }, info: { name: 1, } } }).toArray();

    const findItems = (ids: ObjectId[]) => {
        const result = [];
        for(const id of ids) {
            for(const item of items) {
                if(id.equals(item._id)) {
                    result.push({ image: item.library?.preview, name: item.info.name, _id: item._id });
                    break;
                }
            }
        }
        return result;
    }
    const findCollections = (ids: ObjectId[]) => {
        const result = [];
        for(const id of ids) {
            for(const collection of restaurant.collections) {
                if(id.equals(collection._id)) {
                    result.push({ image: collection.image?.buffer, name: collection.name, _id: collection._id });
                    break;
                }
            }
        }
        return result;
    }

    const collections = findCollections(restaurant.sorting.times[time as "morning"].collections);
    const itemsOnTheDay = findItems(restaurant.sorting.times[time as "morning"].items);


    res.send({ items: itemsOnTheDay, collections });
});
router.put("/time/items", logged(), restaurantWorker({  }), async (req, res) => {
    const { time } = req.query;
    const { restaurant } = res.locals as Locals;
    const { items } = req.body;

    if(!time || typeof time != "string" || !["morning", "afternoon", "evening", "night"].includes(time)) {
        return res.status(400).send({ reason: "InvalidTime" });
    }
    if(!Array.isArray(items)) {
        return res.status(422).send({ reason: "InvalidItems" });
    }


    const itemsIds: ObjectId[] = [];
    for(const itemId of items) {
        if(!itemId || typeof itemId != "string" || itemId.length != 24) {
            return res.status(422).send({ reason: "InvalidItems" });
        }
        itemsIds.push(id(itemId));
    }

    const allItems = await getItems(restaurant._id, { _id: { $in: itemsIds } }, { projection: { _id: 1 } }).toArray();
    if(allItems.length != itemsIds.length) {
        return res.status(400).send({ reason: "InvalidItems" });
    }


    const $set: any = {};
    $set[`sorting.times.${time}.items`] = itemsIds;



    const update = await updateRestaurant({ _id: restaurant._id, }, { $set }, { projection: { _id: 1 } });


    res.send({ updated: update.ok == 1 });
});
router.put("/time/items/remove", logged(), restaurantWorker({  }), async (req, res) => {
    const { time } = req.query;
    const { restaurant } = res.locals as Locals;
    const { itemId } = req.body;

    if(!time || typeof time != "string" || !["morning", "afternoon", "evening", "night"].includes(time)) {
        return res.status(400).send({ reason: "InvalidTime" });
    }
    if(!itemId || typeof itemId != "string" || itemId.length != 24) {
        return res.status(422).send({ reason: "InvalidItemId" });
    }

    const item = await getItem(restaurant._id, { _id: id(itemId) }, { projection: { _id: 1 } });
    if(!item) {
        return res.status(404).send({ reason: "InvalidItem" });
    }

    const $pull: any = {};
    $pull[`sorting.times.${time}.items`] = item._id;

    const update = await updateRestaurant({ _id: restaurant._id }, { $pull }, { projection: { _id: 1 } });

    res.send({ updated: update.ok == 1 });
});
router.put("/time/collections", logged(), restaurantWorker({ collections: { _id: 1 } }), async (req, res) => {
    const { time } = req.query;
    const { restaurant } = res.locals as Locals;
    const { collections } = req.body;

    if(!time || typeof time != "string" || !["morning", "afternoon", "evening", "night"].includes(time)) {
        return res.status(400).send({ reason: "InvalidTime" });
    }
    if(!Array.isArray(collections)) {
        return res.status(422).send({ reason: "InvalidCollections" });
    }
    if(!restaurant.collections) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    const findCollection = (id: string) => {
        for(const collection of restaurant.collections) {
            if(collection._id.equals(id)) {
                return true;
            }
        }
        return false;
    }


    const collectionsIds: ObjectId[] = [];
    for(const collectionId of collections) {
        if(!collectionId || typeof collectionId != "string" || collectionId.length != 24) {
            return res.status(422).send({ reason: "InvalidCollections" });
        }
        if(!findCollection(collectionId)) {
            return res.status(400).send({ reason: "InvalidCollections" });
        }
        collectionsIds.push(id(collectionId));
    }



    const $set: any = {};
    $set[`sorting.times.${time}.collections`] = collectionsIds;



    const update = await updateRestaurant({ _id: restaurant._id, }, { $set }, { projection: { _id: 1 } });


    res.send({ updated: update.ok == 1 });
});
router.put("/time/collections/remove", logged(), restaurantWorker({ collections: { _id: 1 } }), async (req, res) => {
    const { time } = req.query;
    const { restaurant } = res.locals as Locals;
    const { collectionId } = req.body;

    if(!time || typeof time != "string" || !["morning", "afternoon", "evening", "night"].includes(time)) {
        return res.status(400).send({ reason: "InvalidTime" });
    }
    if(!collectionId || typeof collectionId != "string" || collectionId.length != 24) {
        return res.status(422).send({ reason: "InvalidCollectionId" });
    }
    
    const findCollection = (id: string) => {
        for(const collection of restaurant.collections) {
            if(collection._id.equals(id)) {
                return true;
            }
        }
        return false;
    }

    if(!findCollection(collectionId)) {
        return res.status(404).send({ reason: "CollectionNotFound" });
    }

    

    const $pull: any = {};
    $pull[`sorting.days.${time}.collections`] = id(collectionId);

    const update = await updateRestaurant({ _id: restaurant._id }, { $pull }, { projection: { _id: 1 } });

    res.send({ updated: update.ok == 1 });
});





export {
    router as SortingRouter,
}