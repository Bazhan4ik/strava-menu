import { DoorDashError } from "@doordash/sdk";
import { Filter, FindOneAndUpdateOptions, FindOptions, ObjectId, UpdateFilter, UpdateOptions } from "mongodb";
import { sessionsDBName } from "../../config.js";
import { Session, TimelineComponent } from "../../models/session.js";
import { doorDashClient } from "../../setup/doordash.js";
import { client } from "../../setup/mongodb.js";
import { convertSessionItems } from "../convertSessionItems.js";
import { id } from "../other/id.js";
import { updateOrders } from "./orders.js";
import { getRestaurant } from "./restaurant.js";
import { sendToCustomerDeliveryValidationFalied, sendToCustomerPaymentSucceeded } from "../socket/customer.js";
import { sendToStaffNewOrder } from "../socket/items.js";
import { getDelay } from "../other/time.js";
import { addDeliveryToGlobalStorage } from "./doordash.js";


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
    restaurantId: string | ObjectId;
    sessionId: string | ObjectId;
    payed: boolean;
    paymentMethodId?: string;
}) {
    try {
        const { restaurantId, sessionId, payed, paymentMethodId } = data;

        const session = await getSession(
            id(restaurantId),
            { _id: id(sessionId) },
            { projection: { payment: { payed: 1, }, items: 1, status: 1, customer: { socketId: 1, customerId: 1, }, info: 1 } }
        );

        const timeline: TimelineComponent = {
            action: "payed",
            time: Date.now(),
            userId: "customer",
        }

        if(!session) {
            const update = await updateOrders(
                id(restaurantId),
                { _id: id(sessionId) },
                { $set: { "payment.payed": true, "payment.paymentMethodId": paymentMethodId }, $push: { timeline } },
                { noResponse: true }
            );

            return false;
        }
    
        if(session.info.type == "delivery") {
            createDelivery(session, restaurantId as string);
        }


        client.db(sessionsDBName).collection<Session>(restaurantId.toString()).findOneAndUpdate(
            { _id: id(sessionId) },
            { $set: {
                status: "progress",
                "payment.method": "card",
                "payment.payed": payed,
                "timing.ordered": Date.now(),
            }, $push: {
                timeline
            } },
            { noResponse: true }
        );


        const convertedOrderItems = await convertSessionItems({
            sessionItems: session?.items!,
            deliveryTime: session.info.delivery?.time!,
            customerId: session?.customer.customerId!,
            comment: session?.info.comment,
            restaurantId: id(restaurantId),
            ordered: getDelay(Date.now()),
            type: session?.info.type!,
            sessionId: id(sessionId),
            id: session?.info.id!,
            skip: [],
        });

        sendToStaffNewOrder(id(restaurantId), session?.info.location!, convertedOrderItems);
        sendToCustomerPaymentSucceeded(id(restaurantId), session?.info.location!, id(sessionId));

        return true;
    } catch (e) {
        console.error("at confirmSession()");
        throw e;
    }
}



async function createDelivery(session: Session, restaurantId: string) {
    if(
        !session.info.delivery?.address?.city ||
        !session.info.delivery.address.state ||
        !session.info.delivery.address.postalCode ||
        !session.info.delivery.address.line1 ||
        !session.info.delivery.time ||
        !session.info.delivery.phone
    ) {
        console.error("DELIVERY: invalid session address");
        // DO SOMETHIG!! ADDRESS IS NOT ADDED
        return;
    };


    const restaurant = await getRestaurant({ _id: id(restaurantId) }, { projection: { locations: { _id: 1, state: 1, line1: 1, city: 1, postalCode: 1, phone: 1 } } });

    if(!restaurant || !restaurant.locations) {
        console.error("DELIVERY: no restaurant or locations");
        return;
    }

    const getLocation = () => {
        for(const location of restaurant.locations!) {
            if(location._id.equals(session.info.location)) {
                return location;
            }
        }
        return null;
    }

    const location = getLocation();
    if(!location) {
        console.error("DELIVERY: no restaurant location found");
        return;
    }
    

    try {
        const delivery = await doorDashClient.createDelivery(
            {
                external_delivery_id: session.info.id,
                pickup_address: `${location.line1}, ${location.city}, ${location.state}, ${location?.postalCode}`,
                pickup_phone_number: location.phone,
                dropoff_address: `${session.info.delivery.address.line1}, ${session.info.delivery.address.city}, ${session.info.delivery.address.state}, ${session.info.delivery.address?.postalCode}`,
                dropoff_phone_number: session.info.delivery?.phone!,
                pickup_time: new Date((new Date(session.info.delivery?.time).getTime() - 5 * 60000)).toISOString(),
            }
        );


        if(delivery.status == 200) {
            addDeliveryToGlobalStorage(restaurant._id, session._id, delivery.data.external_delivery_id);
        }


        return delivery.status == 200;
    } catch (e: any) {
        const error = e as DoorDashError;
        console.log(error);
        
        if(error.errorCode == "validation_error") {

            updateSession(restaurant._id, { _id: session._id, }, { $set: { "info.delivery.failed": true, "info.delivery.failedReason": error.errorCode } }, { noResponse: true });

            sendToCustomerDeliveryValidationFalied(restaurant._id, session.customer.socketId, { sessionId: session._id });

        }

        return;
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