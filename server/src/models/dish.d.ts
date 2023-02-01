import { ObjectId } from "mongodb";

interface Ingredient {
    id: string;
    amount: number;
}

interface Dish {
    _id: ObjectId;
    id: string;

    ingredients: Ingredient[];
    tags: string[];

    info: {
        name: string;
        description: string;
        price: number;
    };

    library: {
        preview: Buffer;
        modified: number;
        userId: ObjectId;
        list: {
            resolution: number;
            buffer: Buffer;
        }[];
    };
}


export {
    Dish,
    Ingredient,
}