import { Time } from "global-models/time";




interface ConvertedSessionItem {
    _id: string;
    itemId: string;
    sessionId: string;
    comment: string;
    orderComment: string;
    id: string;
    status: "cooking" | "ordered" | "cooked" | "cooking:disposing" | "cooked:disposing";

    order: {
        type: string;
        id: string;
        title: string;
    }

    item: {
        name: string;
        image: any;
    };

    people?: {
        cook?: { name: string; avatar: any; _id: string; };
        waiter?: { name: string; avatar: any; _id: string; };
        customer?: { name: string; avatar: any; _id: string; };
    };

    takenInterval?: any;
    orderedInterval?: any;

    takenTimeout?: any;
    orderedTimeout?: any;

    danger: boolean;
    warning: boolean;

    time: {
        ordered: Time;

        taken?: Time;

        cooked?: Time;

        served?: Time;

        beReady?: number;

        averageCooking?: number;
    };
}

interface Folder {
    items: ConvertedSessionItem[];
    sessionId: string;
    type: string;
    id: string;
}



export {
    ConvertedSessionItem,
    Folder
}