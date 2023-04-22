import { ObjectId } from "mongodb";
import { SessionItemStatus } from "../../models/session.js";
import { io } from "../../setup/setup.js";


function sendToCustomerPaymentSucceeded(restaurantId: ObjectId, locationId: ObjectId, sessionId: ObjectId) {
    io.to(restaurantId.toString()).to(`${restaurantId}/${locationId}`).emit("customer", { types: ["payment", "payment/succeeded"], sessionId });
}

function sendToCustomerItemStatus(restaurantId: ObjectId, socketId: string, data: { sessionItemId: ObjectId; status: SessionItemStatus; }) {
    io.to(restaurantId.toString()).to(socketId).emit("customer", { types: ["items", "items/status"], data });
}

function sendToCustomerDeliveryValidationFalied(restaurantId: ObjectId, socketId: string, data: { sessionId: ObjectId; }) {
    io.to(restaurantId.toString()).to(socketId).emit("customer", { types: ["delivery", "delivery/validation", "delivery/error"], data });
}


export {
    sendToCustomerPaymentSucceeded,
    sendToCustomerItemStatus,
    sendToCustomerDeliveryValidationFalied,
}