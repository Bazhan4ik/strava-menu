import { ObjectId } from "mongodb";
import { io } from "../../setup/setup.js";


function sendToCustomerPaymentSucceeded(restaurantId: ObjectId, locationId: ObjectId, sessionId: ObjectId) {
    io.to(restaurantId.toString()).to(`${restaurantId}/${locationId}`).emit("customer", { types: ["payment", "payment/succeeded"], sessionId });
}

function sendToCustomerDishStatus(restaurantId: ObjectId, socketId: string, data: { sessionDishId: ObjectId; status: string; }) {
    io.to(restaurantId.toString()).to(socketId).emit("customer", { types: ["dishes", "dishes/status"], data });
}


export {
    sendToCustomerPaymentSucceeded,
    sendToCustomerDishStatus,
}