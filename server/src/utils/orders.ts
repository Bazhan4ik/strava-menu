import { Filter, FindOptions, ObjectId } from "mongodb";
import { ordersDBName } from "../config.js";
import { Session } from "../models/session.js";
import { client } from "../setup/mongodb.js";
import { getSession, removeSession } from "./sessions.js";

async function addOrder(restaurantId: ObjectId, sessionId: ObjectId) {
    try {
        
        const session = await getSession(restaurantId, { _id: sessionId }, { });

        if(!session) {
            return 1; // 1 session not found
        }

        session.status = "done";

        const added = await client.db(ordersDBName).collection(restaurantId.toString()).insertOne(session);

        if(added) {
            const removed = await removeSession(restaurantId, sessionId);

            return 3; // success
        }


        return 2; // session not added to orders
    } catch (e) {
        console.error("at addOrder()");
        throw e;
    }
}


function getOrders(restaurantId: ObjectId, filter: Filter<Session>, options: FindOptions) {
    try {
        return client.db(ordersDBName).collection<Session>(restaurantId.toString()).find(filter, options);
    } catch (e) {
        console.error("at getOrders()");
        throw e;
    }
}


export {
    addOrder,
    getOrders,
}