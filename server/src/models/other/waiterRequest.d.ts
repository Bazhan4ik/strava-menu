import { ObjectId } from "mongodb";
import { Time } from "./time.js";

interface ConvertedWaiterRequest {
    customer: { name: string; avatar: any; };
    waiter?: { name: string; avatar: any; };
    sessionId: ObjectId | string;
    _id: ObjectId | string;
    requestedTime: Time;
    acceptedTime?: Time;
    reason: string;
    total: number;
    self: boolean;
}


export {
    ConvertedWaiterRequest
}