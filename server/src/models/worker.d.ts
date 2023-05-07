import { ObjectId } from "mongodb";

interface WorkerSettings {
    work?: {
        cook?: boolean;
        waiter?: boolean;
        manager?: boolean;
    };
    
    settings?: {
        customers?: boolean;
        payments?: boolean;
        info?: boolean;
        available?: boolean;
    };

    locations?: {
        available?: boolean;

        adding?: boolean;
        removing?: boolean;
    }

    items?: {
        available?: boolean; // if one of the optoins below are true other is true, other lets worker see the list of dishes, dishes info, dishes statistics

        removing?: boolean;
        adding?: boolean;
    }

    collections?: {
        available?: boolean;

        removing?: boolean;
        adding?: boolean;
    }

    staff?: {
        available?: boolean;

        settings?: boolean;
        firing?: boolean;
        hiring?: boolean;
    }

    customers?: {
        available?: boolean;

        blacklisting?: boolean;
        tables?: boolean;
    };

    cook?: {
        refunding?: boolean;
    }

    waiter?: {
        refunding?: boolean;
    }


    isOwner?: boolean;
}

interface Shift {
    startHours: number;
    startMinutes: number;
    endHours: number;
    endMinutes: number;
    days: number[];
    _id: ObjectId;
}

interface Worker {
    userId: ObjectId;
    settings: WorkerSettings;

    joined?: number;

    locations: ObjectId[];
    shifts: Shift[];

    lastUpdate?: {
        time: number;
        userId: ObjectId;
    }
}


export {
    Worker,
    WorkerSettings,
    Shift,
}