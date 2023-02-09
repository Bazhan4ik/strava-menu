import { Filter, FindOneAndUpdateOptions, FindOptions, UpdateFilter } from "mongodb";
import { dishesDBName, mainDBName, ordersDBName, sessionsDBName } from "../config.js";
import { Restaurant } from "../models/restaurant.js";
import { WorkerSettings } from "../models/worker.js";
import { client } from "../setup/mongodb.js";
import { updateUser } from "./users.js";


async function createRestaurant(newRestaurant: Restaurant) {
    try {
        
        
        const [added] = await Promise.all([
            client.db(mainDBName).collection("restaurants").insertOne(newRestaurant),
            updateUser({ _id: newRestaurant.info.owner }, { $push: { restaurants: { restaurantId: newRestaurant._id, redirectTo: "dashboard" } } }, { projection: { _id: 1, } }),
            client.db(ordersDBName).createCollection(newRestaurant._id.toString()),   
            client.db(sessionsDBName).createCollection(newRestaurant._id.toString()),   
            client.db(dishesDBName).createCollection(newRestaurant._id.toString()),   
        ])

        return added.acknowledged;
    } catch (e) {
        console.error("at createRestaurant()");
        throw e;
    }
}


async function getRestaurants(filter: Filter<Restaurant>, options: FindOptions): Promise<Restaurant[]> {
    try {
        const result = await client.db(mainDBName).collection<Restaurant>("restaurants").find(filter, options).toArray();


        return result;
    } catch (e) {
        console.error("at getRestaurants()");
        throw e;
    }
}

async function getRestaurant(filter: Filter<Restaurant>, options: FindOptions): Promise<Restaurant | null> {
    try {
        
        const result = await client.db(mainDBName).collection<Restaurant>("restaurants").findOne(filter, options);

        return result;
    } catch (e) {
        console.error("at getRestaurant()");
        throw e;
    }
}

async function updateRestaurant(filter: Filter<Restaurant>, update: UpdateFilter<Restaurant>, options: FindOneAndUpdateOptions) {
    try {
        
        const result = await client.db(mainDBName).collection<Restaurant>("restaurants").findOneAndUpdate(filter, update, options);

        return {
            restaurant: result?.value,
            ok: result?.ok,
        };
    } catch (e) {
        console.error("at updateRestaurant()");
        throw e;
    }
}


function compareWorkerSettings(
    workerSettings: WorkerSettings,
    compareTo: WorkerSettings[]
) {
    if(workerSettings.isOwner) {
        return true;
    }

    for(let settings of compareTo) {
        const passed = Object.entries(settings).every(([key1, value1]: [string, object]) => {
            return Object.entries(value1).every(([key2, value2]: [string, boolean]) => {
                return workerSettings[key1 as keyof WorkerSettings]![key2 as keyof WorkerSettings["collections"]] == value2;
            });
        });

        if(passed) {
            return true;
        }
    }
    
    return false;
}



export {
    createRestaurant,
    getRestaurants,
    compareWorkerSettings,
    getRestaurant,
    updateRestaurant,
}