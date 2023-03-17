import { ObjectId } from "mongodb";
import { SessionDishStatus } from "../session.js";
import { Time } from "./time.js";



interface ConvertedSessionDish {
    _id: ObjectId;
    dishId: ObjectId;
    sessionId: ObjectId;
    comment: string;
    orderComment: string;
    id: string;
    status: SessionDishStatus;

    order: {
        type: string;
        id: string;
    }

    dish: {
        name: string;
        image: any;
    };

    people: {
        cook?: { name: string; avatar: any; _id: ObjectId; };
        waiter?: { name: string; avatar: any; _id: ObjectId; };
        customer: { name: string; avatar: any; _id: ObjectId; };
    }


    time: {
        ordered: Time;

        taken?: Time;

        cooked?: Time;

        served?: Time;
    }
}



export {
    ConvertedSessionDish
}