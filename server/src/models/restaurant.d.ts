import { ObjectId } from "mongodb";
import { Worker } from "./worker.js";


interface Restaurant {
    _id: ObjectId;

    status?: "disabled" | "deleted" | "rejected" | "enabled";
    
    stripe?: {
        stripeAccountId?: string;
        card: "enabled" | "disabled" | "pending" | "rejected" | "restricted";
        payouts: "pending" | "rejected" | "restricted";
        account: "unverified" | "verified" | "pending";
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

    ingredients: {
        prices: Ingredients.Price[];
        current: Ingredients.Usage[];
        history: Ingredients.Usage[];
    };
    
    blacklist?: (ObjectId | string)[];
    collections: Collection[];
    locations?: Location[];
    folders: Folder[];
    customers?: Customer[];
    staff?: Worker[];
    layout: LayoutElement[];
    
    tables?: { [locationId: string]: Table[]; };
}


interface LayoutElement {
    _id: ObjectId;
    position: number;
    type: "collection" | "folder" | "dish";
    data?: { id: ObjectId };
}

interface LocationSettings {
    customers?: {
        maxDishes: number; // 0 is unlimited
        allowOrderingOnline: boolean;
        allowDineIn: boolean;
        allowTakeOut: boolean;
    },
    methods?: {
        card: boolean;
        cash: boolean;
    }
    serviceFee: {
        amount: number;
        type: 1 | 2; // 1 - $ amount, 2 - % amount
    } | null;
    tips: boolean;
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

    settings: LocationSettings;

    latlng: [number, number];
}

interface Collection {
    _id: ObjectId;
    id: string;
    name: string;
    image?: {
        buffer: Buffer;
        userId: ObjectId;
    };
    dishes: ObjectId[];
    description: string;
}

interface Folder {
    _id: ObjectId;
    id: string;
    name: string;
    collections: ObjectId[];
}

interface Table {
    id: number;
    _id: ObjectId;
}

interface Customer {
    userId: ObjectId;
    orders: ObjectId[];
    last: number;
}

declare namespace Ingredients {
    interface Usage {
        id: string;
        amount: number;
        price?: number;
    }
    interface Price {
        id: string;
        price: number;
    }
}

export {
    Restaurant,
    Collection,
    Location,
    Table,
    Ingredients,
    LocationSettings,
    Folder,
    LayoutElement,
}