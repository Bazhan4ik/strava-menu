import { Filter, FindOneAndUpdateOptions, FindOptions, ObjectId, UpdateFilter, UpdateOptions } from "mongodb";
import { sessionsDBName } from "../config.js";
import { Session } from "../models/session.js";
import { client } from "../setup/mongodb.js";
import { convertSessionDishes } from "./convertSessionDishes.js";
import { id } from "./id.js";
import { restaurantWorker } from "./middleware/restaurant.js";
import { updateOrders } from "./orders.js";
import { sendToCustomerPaymentSucceeded } from "./socket/customer.js";
import { sendToStaffNewOrder } from "./socket/dishes.js";
import { getDelay } from "./time.js";


async function getSession(restaurantId: ObjectId, filter: Filter<Session>, options: FindOptions<Session>): Promise<Session> {
    try {
        
        const result = await client.db(sessionsDBName).collection<Session>(restaurantId.toString())
            .findOne(filter, options);

        return result!;
    } catch (e) {
        console.error("at getSession()");
        throw e;
    }
}


async function createSession(restaurantId: ObjectId, session: Session) {
    try {
        const result = await client.db(sessionsDBName).collection(restaurantId.toString())
            .insertOne(session);

        return result;
    } catch (e) {
        console.error("at createSession()");
        throw e;
    }
}


async function updateSession(restaurantId: ObjectId, filter: Filter<Session>, update: UpdateFilter<Session>, options: FindOneAndUpdateOptions) {
    try {
        
        const result = await client.db(sessionsDBName).collection<Session>(restaurantId.toString())
            .findOneAndUpdate(filter, update, { returnDocument: "after", ...options});

        return {
            ok: result?.ok,
            session: result?.value,
        };
    } catch (e) {
        console.error("at updateSession()");
        throw e;
    }
}

async function updateSessions(restaurantId: ObjectId, filter: Filter<Session>, update: UpdateFilter<Session>, options: UpdateOptions) {
    try {
        return client.db(sessionsDBName).collection<Session>(restaurantId.toString()).updateMany(filter, update, options);
    } catch (e) {
        console.error(" at updateSessions()");
        throw e;
    }
}


function getSessions(restaurantId: ObjectId, filter: Filter<Session>, options: FindOptions<Session>) {
    try {
        return client.db(sessionsDBName).collection<Session>(restaurantId.toString()).find(filter, options);
    } catch (e) {
        console.error("at getSessions()");
        throw e;
    }
}

function aggregateSessions(restaurantId: ObjectId, pipeline: any[]) {
    try {
        return client.db(sessionsDBName).collection(restaurantId.toString()).aggregate(pipeline);
    } catch (e) {
        console.error("at aggregateSessions()");
        throw e;
    }
}


function removeSession(restaurantId: ObjectId, sessionId: ObjectId) {
    try {
        return client.db(sessionsDBName).collection(restaurantId.toString()).deleteOne({ _id: sessionId });
    } catch (e) {
        console.error("at removeSession()");
        throw e;
    }
}











/**
 * 
 * Called on "payment-intent.succeeded" or "setup-intent.succeeded"
 * Confirm Session
 * 
 * Sets status to "confirm" sends data to kitchen
 * 
 */
async function confirmSession(data: {
    restaurantId: string;
    sessionId: string;
    payed: boolean;
    paymentMethodId?: string;
}) {
    try {
        const { restaurantId, sessionId, payed, paymentMethodId } = data;

        const session = await getSession(
            id(restaurantId),
            { _id: id(sessionId) },
            { projection: { payment: { payed: 1, }, status: 1 } }
        );

        if(!session) {

            const update = await updateOrders(
                id(restaurantId),
                { _id: id(sessionId) },
                { $set: { "payment.payed": true, "payment.paymentMethodId": paymentMethodId } },
                { noResponse: true }
            );

            return false;
        }
        

        const result = await client.db(sessionsDBName).collection<Session>(restaurantId).findOneAndUpdate(
            { _id: id(sessionId) },
            { $set: {
                status: "progress",
                "payment.method": "card",
                "payment.payed": payed,
                "timing.ordered": Date.now(),
            } },
            { projection: { dishes: 1, customer: { customerId: 1, }, info: { location: 1, comment: 1, } } }
        );

        const convertedOrderDishes = await convertSessionDishes({
            restaurantId: id(restaurantId),
            sessionId: id(sessionId),
            ordered: getDelay(Date.now()),
            sessionDishes: result.value?.dishes!,
            skip: [],
            customerId: result.value?.customer.customerId!,
            comment: result.value?.info.comment,
        });

        sendToStaffNewOrder(id(restaurantId), result.value?.info.location!, convertedOrderDishes);
        sendToCustomerPaymentSucceeded(id(restaurantId), result.value?.info.location!, id(sessionId));

        return result.ok == 1;
    } catch (e) {
        console.error("at confirmSession()");
        throw e;
    }
}






export {
    getSession,
    createSession,
    updateSession,
    confirmSession,
    getSessions,
    aggregateSessions,
    removeSession,
    updateSessions,
}