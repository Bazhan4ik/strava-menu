import { ObjectId } from "mongodb";
import { deliveriesDBName } from "../../config.js";
import { client } from "../../setup/mongodb.js";




async function addDeliveryToGlobalStorage(restaurantId: ObjectId, sessionId: ObjectId, deliveryId: string) {
    try {
        
        const update = await client.db(deliveriesDBName).collection("list").updateOne({ restaurantId: restaurantId }, { $push: { deliveries: { sessionId, deliveryId } } }, { upsert: true });

        return update;
    } catch (e) {
        console.error("ERROR: addDeliveryToGlobalStorage()");
        throw e;
    }
}


async function findDeliveryInGlobalStorage(deliveryId: string) {
    try {
        
        const result = await client.db(deliveriesDBName).collection<{ restaurantId: ObjectId; deliveries: { sessionId: ObjectId; deliveryId: string }[] }>("list").findOne({ deliveries: { $elemMatch: { deliveryId } } });

        if(!result) {
            return null;
        }

        for(const delivery of result.deliveries) {
            if(delivery.deliveryId == deliveryId) {
                return { restaurantId: result.restaurantId, delivery };
            }
        }

        return null;
    } catch (e) {
        console.error("ERROR: findDeliveryInGlobalStorage()");
        throw e;
    }
}


export {
    addDeliveryToGlobalStorage,
    findDeliveryInGlobalStorage
}