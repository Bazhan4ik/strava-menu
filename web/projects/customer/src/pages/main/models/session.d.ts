import { Time } from "global-models/time";

interface Session {
    id: string;
    type: "dinein" | "takeout";

    items: { _id: string; itemId: string; comment: string; }[];

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