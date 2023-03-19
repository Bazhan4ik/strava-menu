import { Filter, FindOneAndUpdateOptions, FindOptions, ObjectId, UpdateFilter } from "mongodb";
import { itemsDBName, mainDBName } from "../config.js";
import { Item } from "../models/item.js";
import { client } from "../setup/mongodb.js";


async function addItem(restaurantId: ObjectId, item: Item) {
    try {

        const result = await client.db(itemsDBName).collection(restaurantId.toString()).insertOne(item);

        return result.acknowledged;
    } catch (e) {
        console.error("at addItem()");
        throw e;
    }
}

function getItems(restaurantId: ObjectId, filter: Filter<Item>, options: FindOptions<Item>) {
    try {

        const result = client.db(itemsDBName).collection<Item>(restaurantId.toString()).find(filter, options);


        return result;
    } catch (e) {
        console.error("at getItem()");
        throw e;
    }
}

async function getItem(restaurantId: ObjectId, filter: Filter<Item>, options: FindOptions<Item>): Promise<Item | null> {
    try {
        const result = await client.db(itemsDBName).collection<Item>(restaurantId.toString()).findOne(filter, options);

        return result;
    } catch (e) {
        console.error("at getItem()");
        throw e;
    }
}

async function updateItem(restaurantId: ObjectId, filter: Filter<Item>, update: UpdateFilter<Item>, options: FindOneAndUpdateOptions) {
    try {

        const result = await client.db(itemsDBName).collection<Item>(restaurantId.toString()).findOneAndUpdate(filter, update, options);

        return {
            item: result.value,
            ok: result.ok,
        }
    } catch (e) {
        console.error("at updateItem()");
        throw e;
    }
}

async function deleteItem(restaurantId: ObjectId, itemId: ObjectId) {
    try {

        return await client.db(itemsDBName).collection(restaurantId.toString()).deleteOne({ _id: itemId });

    } catch (e) {
        console.error("at deleteItem()");
        throw e;
    }
}


export {
    addItem,
    getItems,
    getItem,
    updateItem,
    deleteItem,
}