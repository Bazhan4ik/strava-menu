import { ConvertedSessionDish } from "./order-dishes";

declare namespace CookDishesData {
    type add = ConvertedSessionDish[];
    type take = { sessionId: string; sessionDishId: string; cook: { name: string; avatar: any; _id: string; } };
    type quit = { sessionId: string; sessionDishId: string; };
    type done = { sessionId: string; sessionDishId: string; };
}


type CookDishesTypes = "dishes/new" | "dishes" | "dishes/take" | "dishes/done" | "dishes/quit";

interface CookDishesEvent {
    data: CookDishesData.add | CookDishesData.take | CookDishesData.quit | CookDishesData.done;
    types: CookDishesTypes[];
}


export {
    CookDishesEvent,
    CookDishesTypes,
    CookDishesData,
}