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
    total?: number;
    self: boolean;

    sessionType: string;
    sessionIdNumber: string;

    ui: {
        reasonTitle: string;
        acceptButtonText: string;
        cancelButtonText: string;
        resolveButtonText: string;
        idTitle: string;
        typeTitle: string;
        acceptedTitle?: string;
    }
}


export {
    ConvertedWaiterRequest
}