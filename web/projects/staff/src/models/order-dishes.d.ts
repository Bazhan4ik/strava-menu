import { Time } from "global-models/time";




interface ConvertedSessionDish {
    _id: string;
    dishId: string;
    sessionId: string;
    comment: string;
    orderComment: string;
    id: string;
    status: "cooking" | "ordered" | "cooked";

    dish: {
        name: string;
        image: any;
    };

    people: {
        cook?: { name: string; avatar: any; };
        waiter?: { name: string; avatar: any; };
        customer: { name: string; avatar: any; };
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



export {
    ConvertedSessionDish
}