import { Dish } from "./dish";

interface Collection {
    title: string;
    dishes: Dish[];
    id: string;
    redirectable: boolean;
}




export {
    Collection,
}