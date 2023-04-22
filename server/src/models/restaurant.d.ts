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

    sorting?: {
        days: {
            0: Sorting.Day;  // sunday
            1: Sorting.Day;  // monday ....
            2: Sorting.Day;
            3: Sorting.Day;
            4: Sorting.Day;
            5: Sorting.Day;
            6: Sorting.Day;  // saturday
        };
        times: {
            morning: Sorting.Time;     // 5am-12pm
            afternoon: Sorting.Time;   // 12pm-5pm
            evening: Sorting.Time;     // 5pm-9pm
            night: Sorting.Time;       // 9pm-5am
        }
    } 
    
    blacklist?: (ObjectId | string)[];
    collections: Collection[];
    locations?: Location[];
    folders: Folder[];
    customers?: Customer[];
    staff?: Worker[];
    layout: LayoutElement[];
    
    tables?: { [locationId: string]: Table[]; };
}


declare namespace Sorting {
    interface Day {
        collections: ObjectId[];
        items: ObjectId[];
    }
    interface Time {
        collections: ObjectId[];
        items: ObjectId[];
    }
}

interface LayoutElement {
    _id: ObjectId;
    position: number;
    type: "collection" | "folder" | "item";
    data?: { id: ObjectId };
}

interface LocationSettings {
    customers?: {
        maxItems: number; // 0 is unlimited
        allowOrderingOnline: boolean;
        allowDineIn: boolean;
        allowTakeOut: boolean;
        allowDelivery: boolean;
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
    phone: string;

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
    items: ObjectId[];
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