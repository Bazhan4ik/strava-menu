import { Time } from "global-models/time";

interface Session {
    id: string;
    type: "dinein" | "takeout";

    dishes: { _id: string; dishId: string; comment: string; }[];

    waiterRequest: {
        _id: string;
        reason: string;
        active: string;
        waiter: { name: string; avatar: any };
        accepted: Time;
    };
}



export {
    Session
}