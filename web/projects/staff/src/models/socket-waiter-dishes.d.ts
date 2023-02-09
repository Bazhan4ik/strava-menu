import { ConvertedSessionDish } from "./order-dishes";

declare namespace WaiterDishesData {
    type add = ConvertedSessionDish;
    type serve = { sessionId: string; sessionDishId: string; };
}


type WaiterDishesTypes = "dishes/add" | "dishes" | "dishes/serve";

interface WaiterDishesEvent {
    data: WaiterDishesData.add | WaiterDishesData.serve;
    types: WaiterDishesTypes[];
}


export {
    WaiterDishesEvent,
    WaiterDishesTypes,
    WaiterDishesData,
}