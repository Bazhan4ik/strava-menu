import { ConvertedSessionItem } from "./order-items";

declare namespace WaiterItemsData {
    type add = ConvertedSessionItem;
    type serve = { sessionId: string; sessionItemId: string; };
    type dispose = { sessionId: string; sessionItemId: string; };
    type remove = { sessionId: string; sessionItemId: string; };
}


type WaiterItemsTypes = "items/add" | "items" | "items/serve" | "items/dispose" | "items/remove";

interface WaiterItemsEvent {
    data: WaiterItemsData.add | WaiterItemsData.serve | WaiterItemsData.dispose | WaiterItemsData.remove;
    types: WaiterItemsTypes[];
}


export {
    WaiterItemsEvent,
    WaiterItemsTypes,
    WaiterItemsData,
}