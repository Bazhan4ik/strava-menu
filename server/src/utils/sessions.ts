import { Filter, FindOneAndUpdateOptions, FindOptions, ObjectId, UpdateFilter } from "mongodb";
import { sessionsDBName } from "../config.js";
import { Order } from "../models/session.js";
import { client } from "../setup/mongodb.js";


async function getSession(restaurantId: ObjectId, filter: Filter<Order>, options: FindOptions<Order>) {
    try {
        
        const result = await client.db(sessionsDBName).collection(restaurantId.toString())
            .findOne(filter, options);

        return result;
    } catch (e) {
        console.error("at getSession()");
        throw e;
    }
}


async function createSession(restaurantId: ObjectId, session: Order) {
    try {
        const result = await client.db(sessionsDBName).collection(restaurantId.toString())
            .insertOne(session);

        return result;
    } catch (e) {
        console.error("at createSession()");
        throw e;
    }
}


async function updateSession(restaurantId: ObjectId, filter: Filter<Order>, update: UpdateFilter<Order>, options: FindOneAndUpdateOptions) {
    try {
        
        const result = await client.db(sessionsDBName).collection<Order>(restaurantId.toString())
            .findOneAndUpdate(filter, update, options);

        return {
            ok: result.ok,
            session: result.value,
        };
    } catch (e) {
        console.error("at updateSession()");
        throw e;
    }
}



export {
    getSession,
    createSession,
    updateSession,
}