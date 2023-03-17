import { Time } from "global-models/time";




interface ConvertedSessionDish {
    _id: string;
    dishId: string;
    sessionId: string;
    comment: string;
    orderComment: string;
    id: string;
    status: "cooking" | "ordered" | "cooked";

    order: {
        type: string;
        id: string;
        title: string;
    }

    dish: {
        name: string;
        image: any;
    };

    people: {
        cook?: { name: string; avatar: any; _id: string; };
        waiter?: { name: string; avatar: any; _id: string; };
        customer: { name: string; avatar: any; _id: string; };
    };

    takenInterval?: any;
    orderedInterval?: any;

    takenTimeout?: any;
    orderedTimeout?: any;

    time: {
        ordered: Time;

        taken?: Time;

        cooked?: Time;

        served?: Time;
    };
}

interface Folder {
    dishes: ConvertedSessionDish[];
    sessionId: string;
    type: string;
    id: string;
}



export {
    ConvertedSessionDish,
    Folder
}