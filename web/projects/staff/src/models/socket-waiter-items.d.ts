import { ConvertedSessionItem } from "./order-items";

declare namespace WaiterItemsData {
    type add = ConvertedSessionItem;
    type serve = { sessionId: string; sessionItemId: string; };
}


type WaiterItemsTypes = "items/add" | "items" | "items/serve";

interface WaiterItemsEvent {
    data: WaiterItemsData.add | WaiterItemsData.serve;
    types: WaiterItemsTypes[];
}


export {
    WaiterItemsEvent,
    WaiterItemsTypes,
    WaiterItemsData,
}