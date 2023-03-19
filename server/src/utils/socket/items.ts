import { ObjectId } from "mongodb";
import { ConvertedSessionItem } from "../../models/other/convertedSession.js";
import { io } from "../../setup/setup.js";




function sendToStaffNewOrder(restaurantId: ObjectId, locationId: ObjectId, data: ConvertedSessionItem[]) {
    io
        .to(restaurantId.toString())
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("cook", {
            types: ["items", "items/new"],
            data
        });
}


function sendItemIsTaken(restaurantId: ObjectId, locationId: ObjectId, data: { sessionId: ObjectId; sessionItemId: ObjectId; cook: { name: string; _id: ObjectId, avatar: any; } }) {
    io
        .to(restaurantId.toString())
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("cook", {
            types: ["items", "items/take"],
            data
        });
}


function sendItemIsQuitted(restaurantId: ObjectId, locationId: ObjectId, data: { sessionId: ObjectId; sessionItemId: ObjectId; }) {
    io
        .to(restaurantId.toString())
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("cook", {
            types: ["items", "items/quit"],
            data
        });
}


function sendItemIsDone(restaurantId: ObjectId, locationId: ObjectId, data: ConvertedSessionItem) {
    const room = io
        .to(restaurantId.toString())
        .to(`${restaurantId.toString()}/${locationId.toString()}`);

    room.emit("waiter", {
        types: ["items", "items/add"],
        data
    });
    room.emit("cook", {
        types: ["items", "items/done"],
        data: {
            sessionId: data.sessionId,
            sessionItemId: data._id,
        }
    });
}


function sendItemIsServed(restaurantId: ObjectId, locationId: ObjectId, data: { sessionId: ObjectId; sessionItemId: ObjectId; }) {
    io
        .to(restaurantId.toString())
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("waiter", {
            types: ["items", "items/serve"],
            data
        });
}

export {
    sendToStaffNewOrder,
    sendItemIsServed,
    sendItemIsDone,
    sendItemIsQuitted,
    sendItemIsTaken,
}