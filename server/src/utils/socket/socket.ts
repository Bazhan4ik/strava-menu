import { ObjectId } from "mongodb";
import { io } from "../../setup/setup.js";


/**
 *
 * Join staff and customer to `restaurantId/locationId`
 * 
 * Join spectators to `restaurantId` 
 * Join staff spectators to `restaurantId/locationId`
 * 
 */
function joinCustomer(id: string, restaurantId: ObjectId, locationId: ObjectId) {
    io.in(id).socketsJoin(`${restaurantId.toString()}/${locationId}`);
}
function joinStaff(id: string, restaurantId: ObjectId, location: ObjectId) {
    io.in(id).socketsJoin(`${restaurantId.toString()}/${location.toString()}`);
}



export {
    joinCustomer,
    joinStaff,
}