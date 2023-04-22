import { ObjectId } from "mongodb";
import { SessionItemStatus } from "../session.js";
import { Time } from "./time.js";



interface ConvertedSessionItem {
    _id: ObjectId;
    itemId: ObjectId;
    sessionId: ObjectId;
    comment: string;
    orderComment: string;
    id: string;
    status: SessionItemStatus;

    order: {
        type: string;
        id: string;
    }

    item: {
        name: string;
        image: any;
    };

    people: {
        cook?: { name: string; avatar: any; _id: ObjectId; };
        waiter?: { name: string; avatar: any; _id: ObjectId; };
        customer?: { name: string; avatar: any; _id: ObjectId; };
    }


    time: {
        ordered: Time;
        
        taken?: Time;
        
        cooked?: Time;
        
        served?: Time;
        
        averageCooking?: number;

        beReady?: number; // for delivery orders,  this is the time when the order should be ready 
    }
}



export {
    ConvertedSessionItem
}