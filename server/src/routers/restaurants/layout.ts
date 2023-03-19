import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { LayoutElement } from "../../models/restaurant.js";
import { id } from "../../utils/id.js";
import { getItem, getItems } from "../../utils/items.js";
import { logged } from "../../utils/middleware/auth.js";
import { restaurantWorker } from "../../utils/middleware/restaurant.js";
import { bulkRestaurant, updateRestaurant } from "../../utils/restaurant.js";






const router = Router({ mergeParams: true });



router.get("/", logged(), restaurantWorker({ layout: 1, folders: 1, collections: 1, }), async (req, res) => {
    const { restaurant } = res.locals as Locals;


    if(!restaurant.layout) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    if(!restaurant.collections || !restaurant.folders) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const convertItems = async (ids: ObjectId[]) => {
        const items = await getItems(restaurant._id, { _id: { $in: ids } }, { projection: { id: 1, _id: 1, info: { name: 1, price: 1 } }}).toArray();
        const result = [];
        for(const item of items) {
            result.push({
                name: item.info.name,
                price: item.info.price,
                id: item.id,
                _id: item._id,
            });
        }
        return result;
    }
    const getCollection = async (id: ObjectId) => {
        for(const collection of restaurant.collections) {
            if(collection._id.equals(id)) {
                return { ...collection, image: null, items: await convertItems(collection.items) };
            }
        }
        return null;
    }
    const getFolder = (id: ObjectId) => {
        for(const folder of restaurant.folders) {
            if(folder._id.equals(id)) {
                
                const collections = [];

                for(const cid of folder.collections) {
                    for(const collection of restaurant.collections) {
                        if(collection._id.equals(cid)) {
                            collections.push(collection);
                        }
                    }
                }

                return { ...folder, collections };
            }
        }
    }
    const getItemForElement = async (id: ObjectId) => {
        const item = await getItem(restaurant._id, { _id: id }, { projection: { info: { name: 1, price: 1, description: 1 } } });

        if(!item) {
            return null!;
        }

        return { ...item.info, _id: item._id };
    }

    const result = [];
    for(const element of restaurant.layout) {
        const el: any = {
            name: element.type == "collection" ? "Collection" : element.type == "item" ? "Item" : "Folder",
            _id: element._id,
            type: element.type,
            position: element.position,
        }
        if(!element.data) {
            result.push(el);
            continue;
        }

        if(element.type == "collection") {
            el.data = { collection: await getCollection(element.data.id) };
        } else if(element.type == "folder") {
            el.data = { folder: getFolder(element.data.id) };
        } else if(element.type == "item") {
            el.data = { item: await getItemForElement(element.data.id) };
        }

        if(!el.data.collection && !el.data.folder && !el.data.item) {
            delete el.data;

            updateRestaurant(
                { _id: restaurant._id },
                { $set: { "layout.$[element].data": null! } },
                { arrayFilters: [ { "element._id": element._id } ], noResponse: true },
            );
        }


        result.push(el);
    }

    res.send({ layout: result });
});
router.post("/", logged(), restaurantWorker({ layout: 1 }), async (req, res) => {
    const { type } = req.body;
    const { restaurant } = res.locals as Locals;


    if(!type || typeof type != "string" || !["collection", "folder", "item"].includes(type)) {
        return res.status(400).send({ reason: "InvalidInput" });
    }
    if(!restaurant.layout) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const last = restaurant.layout[restaurant.layout.length - 1];

    const newElement: LayoutElement = {
        _id: id(),
        type: type as any,
        data: null!,
        position: (last?.position || 0) + 1,
    };

    const update = await updateRestaurant(
        { _id: restaurant._id },
        { $push: { "layout": newElement } },
        { projection: { _id: 1 } },
    );

    res.send({ updated: update.ok == 1, element: {...newElement, name: type == "collection" ? "Collection" : type == "item" ? "Item" : "Folder" } });
});
router.put("/collection", logged(), restaurantWorker({ layout: 1, collections: 1 }), async (req, res) => {
    const { collectionId, elementId } = req.body;
    const { restaurant } = res.locals as Locals;
    
    if(!collectionId || !elementId) {
        return res.status(400).send({ reason: "InvalidInput" });
    }
    if(typeof collectionId != "string" || typeof elementId != "string" || collectionId.length != 24 || elementId.length != 24) {
        return res.status(422).send({ reason: "InvalidInput" });
    }
    if(!restaurant.collections || !restaurant.layout) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    const convertItems = async (ids: ObjectId[]) => {
        const items = await getItems(restaurant._id, { _id: { $in: ids } }, { projection: { id: 1, _id: 1, info: { name: 1, price: 1 } }}).toArray();
        const result = [];
        for(const item of items) {
            result.push({
                name: item.info.name,
                price: item.info.price,
                id: item.id,
                _id: item._id,
            });
        }

        return result;
    }
    const getCollection = () => {
        for(const collection of restaurant.collections) {
            if(collection._id.equals(collectionId)) {
                return collection;
            }
        }
        return null;
    }
    const getElement = () => {
        for(const element of restaurant.layout) {
            if(element._id.equals(elementId)) {
                return element;
            }
        }
        return null;
    }

    const collection = getCollection();
    if(!collection) {
        return res.status(404).send({ reason: "CollectionNotFound" });
    }

    const layout = getElement();
    if(!layout) {
        return res.status(404).send({ reason: "ElementNotFound" });
    }

    if(layout.type != "collection") {
        return res.status(403).send({ reason: "WrongType" });
    }

    if(layout.data?.id.equals(collection._id)) {
        return res.send({ updated: true, collection: { ...collection, items: await convertItems(collection.items), image: collection.image?.buffer } });
    }


    const update = await updateRestaurant(
        { _id: restaurant._id },
        { $set: { "layout.$[element].data": { id: collection._id } } },
        { arrayFilters: [ { "element._id": layout._id } ] }
    );

    if(update.ok == 1) {
        return res.send({ updated: true, collection: { ...collection, items: await convertItems(collection.items), image: collection.image?.buffer } });
    }

    res.send({ updated: false });
});
router.put("/item", logged(), restaurantWorker({ layout: 1 }), async (req, res) => {
    const { itemId, elementId } = req.body;
    const { restaurant } = res.locals as Locals;
    
    if(!itemId || !elementId) {
        return res.status(400).send({ reason: "InvalidInput" });
    }
    if(typeof itemId != "string" || typeof elementId != "string" || itemId.length != 24 || elementId.length != 24) {
        return res.status(422).send({ reason: "InvalidInput" });
    }
    if(!restaurant.layout) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getElementItem = async () => {
        const item = await getItem(restaurant._id, { _id: id(itemId) }, { projection: { info: { description: 1, name: 1, price: 1 } } });

        if(!item) {
            return null;
        }
        
        return { ...item.info, _id: item._id };
    }
    const getElement = () => {
        for(const element of restaurant.layout) {
            if(element._id.equals(elementId)) {
                return element;
            }
        }
        return null;
    }

    const item = await getElementItem();

    if(!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }

    const layout = getElement();
    if(!layout) {
        return res.status(404).send({ reason: "ElementNotFound" });
    }

    if(layout.type != "item") {
        return res.status(403).send({ reason: "WrongType" });
    }

    if(layout.data?.id.equals(item._id)) {
        return res.send({ updated: true, item });
    }


    const update = await updateRestaurant(
        { _id: restaurant._id },
        { $set: { "layout.$[element].data": { id: item._id } } },
        { arrayFilters: [ { "element._id": layout._id } ], projection: { _id: 1 } }
    );

    if(update.ok == 1) {
        return res.send({ updated: true, item });
    }

    res.send({ updated: false });
});
router.put("/folder", logged(), restaurantWorker({ layout: 1, folders: 1, collections: 1 }), async (req, res) => {
    const { folderId, elementId } = req.body;
    const { restaurant } = res.locals as Locals;
    
    if(!folderId || !elementId) {
        return res.status(400).send({ reason: "InvalidInput" });
    }
    if(typeof folderId != "string" || typeof elementId != "string" || folderId.length != 24 || elementId.length != 24) {
        return res.status(422).send({ reason: "InvalidInput" });
    }
    if(!restaurant.folders || !restaurant.layout || !restaurant.collections) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    const convertCollections = () => {
        const result = [];
        for(const cid of folder!.collections) {
            for(const collection of restaurant.collections) {
                if(cid.equals(collection._id)) {
                    result.push({ ...collection, image: collection.image?.buffer });
                    break;
                }
            }
        }
        return result;
    }
    const getFolder = () => {
        for(const folder of restaurant.folders) {
            if(folder._id.equals(folderId)) {
                return folder;
            }
        }
        return null;
    }
    const getElement = () => {
        for(const element of restaurant.layout) {
            if(element._id.equals(elementId)) {
                return element;
            }
        }
        return null;
    }

    const folder = getFolder();
    if(!folder) {
        return res.status(404).send({ reason: "FolderNotFound" });
    }

    const layout = getElement();
    if(!layout) {
        return res.status(404).send({ reason: "ElementNotFound" });
    }

    if(layout.type != "folder") {
        return res.status(403).send({ reason: "WrongType" });
    }

    if(layout.data?.id.equals(folder._id)) {
        return res.send({ updated: true, folder: { ...folder, collections: convertCollections() } });
    }


    const update = await updateRestaurant(
        { _id: restaurant._id },
        { $set: { "layout.$[element].data": { id: folder._id } } },
        { arrayFilters: [ { "element._id": layout._id } ] }
    );

    if(update.ok == 1) {
        return res.send({ updated: true, folder: { ...folder, collections: convertCollections() } });
    }

    res.send({ updated: false });
});
router.delete("/:elementId", logged(), restaurantWorker({  }), async (req, res) => {
    const { elementId } = req.params;
    const { restaurant } = res.locals as Locals;

    if(elementId.length != 24) {
        return res.status(400).send({ reason: "InvalidElementId" });
    }

    const update = await updateRestaurant(
        { _id: restaurant._id },
        { $pull: { layout: { _id: id(elementId) } } },
        { projection: { _id: 1 } },
    );


    res.send({ updated: update.ok == 1 });
});
router.put("/position", logged(), restaurantWorker({ layout: 1 }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { elementId, index, move } = req.body;

    if(!restaurant.layout) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    if(!elementId || typeof elementId != "string" || elementId.length != 24) {
        return res.status(400).send({ reason: "InvalidElementId" });
    }
    if(typeof index != "number" || index > restaurant.layout.length || index < 0) {
        return res.status(400).send({ reason: "InvalidIndex" });
    }
    if(!move || typeof move != "number" || ![-1, 1].includes(move)) {
        return res.status(400).send({ reason: "InvalidMove" });
    }

    const element = restaurant.layout[index + move];

    if(!element._id.equals(elementId)) {
        return res.status(400).send({ reason: "ElementNotFound" });
    }



    

    const update = await bulkRestaurant([
        { updateOne: {
            filter: { _id: restaurant._id, },
            update: { $pull: { layout: { _id: element._id } } }
        } },
        { updateOne: {
            filter: { _id: restaurant._id, },
            update: { $push: { layout: { $each: [element], $position: index } } }
        } },
    ]);


    res.send({ updated: update.ok == 1 });
});



export {
    router as LayoutRouter,
}