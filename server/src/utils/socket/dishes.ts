import { ObjectId } from "mongodb";
import { ConvertedSessionDish } from "../../models/other/convertedSession.js";
import { io } from "../../setup/setup.js";




function sendToStaffNewOrder(restaurantId: ObjectId, locationId: ObjectId, data: ConvertedSessionDish[]) {
    io
        .to(restaurantId.toString())
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("cook", {
            types: ["dishes", "dishes/new"],
            data
        });
}


function sendDishIsTaken(restaurantId: ObjectId, locationId: ObjectId, data: { sessionId: ObjectId; sessionDishId: ObjectId; cook: { name: string; _id: ObjectId, avatar: any; } }) {
    io
        .to(restaurantId.toString())
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("cook", {
            types: ["dishes", "dishes/take"],
            data
        });
}


function sendDishIsQuitted(restaurantId: ObjectId, locationId: ObjectId, data: { sessionId: ObjectId; sessionDishId: ObjectId; }) {
    io
        .to(restaurantId.toString())
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("cook", {
            types: ["dishes", "dishes/quit"],
            data
        });
}


function sendDishIsDone(restaurantId: ObjectId, locationId: ObjectId, data: ConvertedSessionDish) {
    const room = io
        .to(restaurantId.toString())
        .to(`${restaurantId.toString()}/${locationId.toString()}`);

    room.emit("waiter", {
        types: ["dishes", "dishes/add"],
        data
    });
    room.emit("cook", {
        types: ["dishes", "dishes/done"],
        data: {
            sessionId: data.sessionId,
            sessionDishId: data._id,
        }
    });
}


function sendDishIsServed(restaurantId: ObjectId, locationId: ObjectId, data: { sessionId: ObjectId; sessionDishId: ObjectId; }) {
    io
        .to(restaurantId.toString())
        .to(`${restaurantId.toString()}/${locationId.toString()}`)
        .emit("waiter", {
            types: ["dishes", "dishes/serve"],
            data
        });
}

export {
    sendToStaffNewOrder,
    sendDishIsTaken,
    sendDishIsQuitted,
    sendDishIsDone,
    sendDishIsServed,
}