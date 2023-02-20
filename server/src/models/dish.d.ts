import { Binary, ObjectId } from "mongodb";

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

    library?: {
        original: Binary;
        preview: Binary;
        blur: Binary;

        modified: number;
        userId: ObjectId;
    };
}


export {
    Dish,
    Ingredient,
}