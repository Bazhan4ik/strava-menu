import { focusElement } from "@ionic/core/dist/types/utils/helpers.js";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../../models/general.js";
import { Folder } from "../../../models/restaurant.js";
import { bufferFromString } from "../../../utils/other/bufferFromString.js";
import { id } from "../../../utils/other/id.js";
import { logged } from "../../../middleware/auth.js";
import { restaurantWorker } from "../../../middleware/restaurant.js";
import { bulkRestaurant, updateRestaurant } from "../../../utils/data/restaurant.js";






const router = Router({ mergeParams: true });


router.get("/", logged(), restaurantWorker({ folders: 1 }, { items: { adding: true } }), (req, res) => { 
    const { restaurant } = res.locals as Locals;

    if(!restaurant.folders) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const result = [];

    for(const folder of restaurant.folders) {
        result.push({
            ...folder,
            collections: folder.collections.length
        });
    }


    res.send(result);
});
router.post("/", logged(), restaurantWorker({ folders: { id: 1, } }, { items: { adding: true } }), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;
    const { name, collections: convertCollections } = req.body;


    if(!name || !convertCollections) {
        return res.status(400).send({ reason: "InvalidInput" });
    }
    if(typeof name != "string" || !Array.isArray(convertCollections)) {
        return res.status(422).send({ reason: "InvalidInput" });
    }
    if(!restaurant.folders) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const collections = [];
    for(const c of convertCollections) {
        if(typeof c != "string" || c.length != 24) {
            continue;
        }
        collections.push(id(c));
    }


    const folder: Folder = {
        _id: id()!,
        name: name.trim(),
        id: name.replace(/[^\w\s]/gi, "").replace(/\s/g, "-").toLowerCase(),
        collections,
    };

    for(const f of restaurant.folders) {
        if(folder.id == f.id) {
            return res.status(403).send({ reason: "Name" });
        }
    }

    const update = await bulkRestaurant([
        { updateOne: {
            filter: { _id: restaurant._id, },
            update: { $push: { folders: { $each: [folder], $position: 0 } } }
        } },
        { updateOne: { 
            filter: { _id: restaurant._id, },
            update: { $pull: { "folders.$[otherId].collections": { $in: collections } } },
            arrayFilters: [ { "otherId.id": "other" } ]
        } }
    ]);


    res.send({ updated: update.ok == 1 });
});
router.get("/:folderId", logged(), restaurantWorker({ collections: 1, folders: 1, }, { items: { available: true } }), async (req, res) => {
    const { folderId } = req.params;
    const { restaurant, } = res.locals as Locals;

    if(!restaurant.collections || !restaurant.folders) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getFolder = () => {
        for(const folder of restaurant.folders) {
            if(folder.id == folderId) {
                return folder;
            }
        }
        return null;
    }
    const getCollections = () => {
        const result = [];
        for(const fc of folder!.collections) {
            for(const collection of restaurant.collections) {
                if(fc.equals(collection._id)) {
                    result.push({
                        ...collection,
                        image: collection.image?.buffer,
                        items: collection.items.length,
                    });
                    break;
                }
            }
        }
        return result;
    }

    const folder = getFolder();
    if(!folder) {
        return res.status(404).send({ reason: "FolderNotFound" });
    }

    const collections = getCollections();


    res.send({ folder: { ...folder }, collections });
});
router.put("/:folderId/collections", logged(), restaurantWorker({ folders: { id: 1, _id: 1, collections: 1, }, collections: { _id: 1 } }, { items: { adding: true } }), async (req, res) => {
    const { folderId } = req.params;
    const { collections } = req.body;
    const { restaurant } = res.locals as Locals;

    if(folderId == "other") {
        return res.status(403).send({ reason: "Folder" });
    }

    if(!restaurant.collections || !restaurant.folders) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    if(!collections) {
        return res.status(400).send({ reason: "InvalidInput" });
    }
    if(!Array.isArray(collections)) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    
    const getFolder = () => {
        for(const folder of restaurant.folders) {
            if(folder.id == folderId) {
                return folder;
            }
        }
        return null!;
    }
    const isThereCollection = (id: string) => {
        for(const collection of restaurant.collections) {
            if(collection._id.equals(id)) {
                return true;
            }
        }
        return false;
    }
    
    const folder = getFolder();
    if(!folder) {
        return res.status(404).send({ reason: "FolderNotFound" });
    }


    const collectionIds = [];
    for(const cid of collections) {
        if(!isThereCollection(cid)) {
            return res.status(400).send({ reason: "InvalidCollections" });
        }
        collectionIds.push(id(cid));
        for(const c in folder.collections) {
            if(folder.collections[c].equals(cid)) {
                folder.collections.splice(+c, 1);
                break;
            }
        }
    }

    const update = await bulkRestaurant([
        { updateOne: {
            filter: { _id: restaurant._id, },
            update: {
                $set: { "folders.$[folder].collections": collectionIds, },
                $pull: { "folders.$[otherId].collections": { $in: collectionIds } },
            },
            arrayFilters: [ { "folder._id": id(folder._id) }, { "otherId.id": "other" } ]
        } },
        {
            updateOne: {
                filter: { _id: restaurant._id, },
                update: {
                    $addToSet: { "folders.$[otherId].collections": { $each: folder.collections } },
                },
                arrayFilters: [ { "otherId.id": "other" } ]
            }
        }
    ]);


    res.send({ updated: update.ok == 1 });
});
router.delete("/:folderId", logged(), restaurantWorker({ folders: 1 }, {}), async (req, res) => {
    const { folderId } = req.params;
    const { restaurant } = res.locals as Locals;

    if(folderId == "other") {
        return res.status(403).send({ reason: "NonRemovableFolder" });
    }

    if(!restaurant.folders) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    

    const getFolder = () => {
        for(const folder of restaurant.folders) {
            if(folder.id == folderId) {
                return folder;
            }
        }
        return null;
    }
    const addCollectionToOther = (id: ObjectId) => {
        for(const folder of restaurant.folders) {
            if(folder._id.equals(folder._id)) {
                continue;
            }
            for(const collection of folder.collections) {
                if(collection.equals(id)) {
                    return false;
                }
            }
        }
        return true;
    }


    const folder = getFolder();
    if(!folder) {
        return res.status(404).send({ reason: "FolderNotFound" });
    }

    const noFolderCollections = [];
    for(const collectionId of folder.collections) {
        if(addCollectionToOther(collectionId)) {
            noFolderCollections.push(collectionId);
        }
    }

    const update = await bulkRestaurant([
        { updateOne: {
            filter: { _id: restaurant._id },
            update: {
                $pull: {
                    folders: { _id: folder._id }
                }
            }
        } },
        { updateOne: {
            filter: { _id: restaurant._id },
            update: {
                $addToSet: { "folders.$[otherId].collections": { $each: noFolderCollections } },
            },
            arrayFilters: [ { "otherId.id": "other" } ]
        }, }
    ])


    res.send({ updated: update.ok == 1 });
});






export {
    router as FoldersRouter,
}