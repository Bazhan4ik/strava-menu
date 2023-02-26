import { ObjectId } from "mongodb";



interface User {
    _id: ObjectId;

    status: "enabled" | "deleted" | "restricted";

    blacklisted?: ObjectId[];

    restaurants: { restaurantId: ObjectId; redirectTo: "dashboard" | "staff" }[];

    orders?: { restaurantId: ObjectId; orderId: ObjectId; }[];

    stripeCustomerId?: string;
    hasPaymentMethod?: boolean;

    avatar?: {
        buffer: Buffer;
        modified: number;
    };
    
    info?: {
        password?: string;
        email?: string;

        anonymously?: boolean;
        
        created?: number;

        name?: {
            first: string;
            last: string;
        };
        location?: {
            country: string;
            city: string;
        }
        dob?: {
            year?: number;
            month?: number;
            day?: number;
        }
    }

    security?: {
        code?: string;
        codeToken?: string;
        codeConfirmed?: number;
        codeAsked?: number;
        tokenUpdated?: number;
    }
}


export {
    User,
}