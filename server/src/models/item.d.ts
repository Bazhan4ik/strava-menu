import { Binary, ObjectId } from "mongodb";


interface Item {
    _id: ObjectId;
    id: string;

    ingredients: Ingredient[];
    tags: string[];

    status: "visible" | "hidden" | "soldout";

    info: {
        name: string;
        description: string;
        price: number;
        averageTime?: number;
    };

    library?: {
        original: Binary;
        preview: Binary;
        blur: Binary;

        modified: number;
        userId: ObjectId;
    };

    modifiers?: Modifier[];
}

interface Ingredient {
    id: string;
    amount: number;
}

interface Modifier {
    _id: ObjectId;
    name: string;
    required: boolean;
    amountToSelect: "less" | "more" | "one";
    amountOfOptions: number;

    options: Option[];
}
interface Option {
    name: string;
    price: number;
    _id: ObjectId;
}


export {
    Item,
    Ingredient,
    Modifier,
}