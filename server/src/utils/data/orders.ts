import { Filter, FindOptions, ObjectId, UpdateFilter, UpdateOptions } from "mongodb";
import { ordersDBName } from "../../config.js";
import { Restaurant } from "../../models/restaurant.js";
import { Session, SessionPayment } from "../../models/session.js";
import { client } from "../../setup/mongodb.js";
import { stripe } from "../../setup/stripe.js";
import { updateRestaurant } from "./restaurant.js";
import { getSession, removeSession } from "./sessions.js";




function getOrders(restaurantId: ObjectId, filter: Filter<Session>, options: FindOptions) {
    try {
        return client.db(ordersDBName).collection<Session>(restaurantId.toString()).find(filter, options);
    } catch (e) {
        console.error("at getOrders()");
        throw e;
    }
}


async function updateOrders(restaurantId: ObjectId, filter: Filter<Session>, update: UpdateFilter<Session>, options: UpdateOptions) {
    try {
        
        return await client.db(ordersDBName).collection<Session>(restaurantId.toString()).updateMany(filter, update, options);

    } catch (e) {
        console.error("at updateOrders()");
        throw e;
    }
}


async function getOrder(restaurantId: ObjectId, filter: Filter<Session>, options: FindOptions): Promise<Session | null> {
    try {
        const result = await client.db(ordersDBName).collection<Session>(restaurantId.toString()).findOne(filter, options);

        return result!;
    } catch (e) {
        console.error("at getOrder()");
        throw e;
    }
}





/**
 * 
 * 
 * MAKE SURE restaurant HAS customers PROPERTY
 * 
 */
async function addOrder(restaurantId: ObjectId, customers: Restaurant["customers"], session: Session) {
    try {

        if(!session) {
            return 1; // 1 session not found
        }

        session.status = "done";

        const added = await client.db(ordersDBName).collection(restaurantId.toString()).insertOne(session);

        if(added) {
            const removed = await removeSession(restaurantId, session._id);


            if (customers && session.customer.customerId) {
                let add = true;
                for (let user of customers) {
                    if (user.userId?.equals(session.customer.customerId)) {
                        updateRestaurant(
                            { _id: restaurantId },
                            {
                                $push: {
                                    "customers.$[customer].orders": session._id,
                                },
                                $set: {
                                    "customers.$[customer].last": session.timing.ordered!,
                                }
                            },
                            { noResponse: true, arrayFilters: [{ "customer.userId": session.customer.customerId }] }
                        );
                        add = false;
                        break;
                    }
                }
                if (add) {
                    updateRestaurant(
                        { _id: restaurantId },
                        {
                            $push: {
                                "customers": {
                                    orders: [session._id],
                                    last: session.timing.ordered!,
                                    userId: session.customer.customerId,
                                },
                            },
                            $set: {
                            }
                        },
                        { noResponse: true }
                    );
                }
            }


            if(!session.payment?.payed) {
                
            }

            return 3; // success
        }


        return 2; // session not added to orders
    } catch (e) {
        console.error("at addOrder()");
        throw e;
    }
}









export {
    addOrder,
    getOrders,
    updateOrders,
    getOrder,
}