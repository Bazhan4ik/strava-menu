import { ObjectId } from "mongodb";
import { Worker } from "./worker.js";


interface Restaurant {
    _id: ObjectId;

    status?: "disabled" | "deleted" | "rejected" | "enabled";
    
    stripe?: {
        stripeAccountId?: string;

    }

    info: {
        description?: string;
        name?: string;
        theme?: string;
        created?: number;
        owner: ObjectId;
        id: string;

        time?: {
            opens: {
                hours: number;
                minutes: number;
                half: "AM" | "PM";
            };
            closes: {
                hours: number;
                minutes: number;
                half: "AM" | "PM";
            };
        };
    };
    
    blacklist?: (ObjectId | string)[];
    settings?: RestaurantSettings;
    collections: Collection[];
    locations?: Location[];
    customers?: Customer[];
    staff?: Worker[];
    tables?: {
        [locationId: string]: Table[]
    };
}


interface RestaurantSettings {
    customers: {
        allowOrderingOnline: boolean;
        maxDishes: number;
        allowDineIn: boolean;
        allowTakeOut: boolean;
        maxCustomers: number;
        minPrice: number;
    },
    dishes: {

    },
    staff: {
        
    }

    money?: {
        card: "enabled" | "disabled" | "rejected" | "restricted" | "pending";
        cash: "enabled" | "disabled";
        payouts: "enabled" | "restricted" | "rejected" | "pending";
    }
}

interface Location {
    country?: string;
    city?: string;
    state?: string;
    line1?: string;
    line2?: string;
    postalCode?: string;

    isUsedForStripe?: boolean;

    name: string;
    _id: ObjectId;
    id: string;

    latlng: [number, number];
}

interface Collection {
    _id: ObjectId;
    id: string;
    name: string;
    image: {
        buffer: Buffer;
        userId: ObjectId;
    };
    dishes: ObjectId[];
    description: string;
}

interface Table {
    id: number;
    _id: ObjectId;
    orders: ObjectId[];
}

interface Customer {
    userId: ObjectId;
    orders: ObjectId[];
    last: number;
}


export {
    Restaurant,
    Collection,
    Location,
    Table,
}