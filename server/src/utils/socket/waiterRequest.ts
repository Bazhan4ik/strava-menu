import { ObjectId } from "mongodb";
import { Time } from "../../models/other/time.js";
import { ConvertedWaiterRequest } from "../../models/other/waiterRequest.js";
import { io } from "../../setup/setup.js";

function sendToWaiterWaiterRequest(restaurantId: ObjectId, locationId: ObjectId, request: ConvertedWaiterRequest) { // customer/session.ts
    io
        .to(restaurantId.toString()) // to restaurant
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("waiter", { // send to restaurant's waiters
            types: ["request/new", "request"],
            data: request
        });
}
function sendToWaiterCancelWaiterRequest(restaurantId: ObjectId, locationId: ObjectId, data: { sessionId: ObjectId; requestId: ObjectId; }) {  // customer/session.ts
    io
        .to(restaurantId.toString()) // to restaurant
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("waiter", { // send to restaurant's waiters
            types: ["request/cancel", "request"],
            data: data
        });
}
function sendToWaiterAcceptWaiterRequest(restaurantId: ObjectId, locationId: ObjectId, data: { user: { name: string; avatar: any; }; time: Time; sessionId: ObjectId; requestId: ObjectId; }) {  // customer/session.ts
    io
        .to(restaurantId.toString()) // to restaurant
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("waiter", { // send to restaurant's waiters
            types: ["request/accept", "request"],
            data: data
        });
}
function sendToWaiterQuitWaiterRequest(restaurantId: ObjectId, locationId: ObjectId, data: { sessionId: ObjectId; requestId: ObjectId; }) {  // customer/session.ts
    io
        .to(restaurantId.toString()) // to restaurant
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("waiter", { // send to restaurant's waiters
            types: ["request/quit", "request"],
            data: data
        });
}
function sendToWaiterResolveWaiterRequest(restaurantId: ObjectId, locationId: ObjectId, data: { sessionId: ObjectId; requestId: ObjectId; }) {  // customer/session.ts
    io
        .to(restaurantId.toString()) // to restaurant
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("waiter", { // send to restaurant's waiters
            types: ["request/resolve", "request"],
            data: data
        });
}




function sendToCustomerAcceptWaiterRequest(socketId: string, data: { waiter: { name: string; avatar: any }, time: Time, requestId: ObjectId; }) { // staff/waiter.ts
    io
        .to(socketId) // to customer
        .emit("customer", {
            types: ["request/accept", "request"],
            data: data
        });
}
function sendToCustomerQuitWaiterRequest(socketId: string, data: { requestId: ObjectId; }) { // staff/waiter.ts
    io
        .to(socketId) // to customer
        .emit("customer", {
            types: ["request/quit", "request"],
            data: data
        });
}
function sendToCustomerResolveWaiterRequest(socketId: string, data: { requestId: ObjectId; }) { // staff/waiter.ts
    io
        .to(socketId) // to customer
        .emit("customer", {
            types: ["request/resolve", "request"],
            data: data
        });
}


function sendToWaiterDeliveryStatus(restaurantId: ObjectId, locationId: ObjectId, data: { sessionId: ObjectId; deliveryStatus: string; canBePickedUp: boolean; }) {  // customer/session.ts
    io
        .to(restaurantId.toString()) // to restaurant
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("waiter", { // send to restaurant's waiters
            types: ["delivery/status", "delivery"],
            data: data
        });
}

function sendToKitchenDisposeOrder(restaurantId: ObjectId, locationId: ObjectId, data: { sessionId: ObjectId; }) {
    io
        .to(restaurantId.toString()) // to restaurant
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("waiter", { // send to restaurant's waiters
            types: ["items/dispose", "items"],
            data: data
        });
    io
        .to(restaurantId.toString()) // to restaurant
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("cook", { // send to restaurant's waiters
            types: ["items/dispose", "items"],
            data: data
        });
}
function sendToCooksRemoveOrder(restaurantId: ObjectId, locationId: ObjectId, data: { sessionId: ObjectId; }) {
    io
        .to(restaurantId.toString()) // to restaurant
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("cook", { // send to restaurant's waiters
            types: ["items/remove", "items"],
            data: data
        });
}


export {
    sendToWaiterWaiterRequest,
    sendToWaiterCancelWaiterRequest,
    sendToCustomerAcceptWaiterRequest,
    sendToCustomerQuitWaiterRequest,
    sendToCustomerResolveWaiterRequest,
    sendToWaiterAcceptWaiterRequest,
    sendToWaiterQuitWaiterRequest,
    sendToWaiterResolveWaiterRequest,
    sendToWaiterDeliveryStatus,
    sendToKitchenDisposeOrder,
    sendToCooksRemoveOrder,
}