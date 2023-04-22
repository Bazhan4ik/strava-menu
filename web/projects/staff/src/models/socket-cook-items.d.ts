import { ConvertedSessionItem } from "./order-items";

declare namespace CookItemsData {
    type add = ConvertedSessionItem[];
    type take = { sessionId: string; sessionItemId: string; cook: { name: string; avatar: any; _id: string; } };
    type quit = { sessionId: string; sessionItemId: string; };
    type done = { sessionId: string; sessionItemId: string; };
    type dispose = { sessionId: string; };
    type remove = { sessionId: string; sessionItemId: string; };
}


type CookItemsTypes = "items/new" | "items" | "items/take" | "items/done" | "items/quit" | "items/dispose" | "items/remove";

interface CookItemsEvent {
    data: CookItemsData.add | CookItemsData.take | CookItemsData.quit | CookItemsData.done | CookItemsData.dispose | CookItemsData.remove;
    types: CookItemsTypes[];
}


export {
    CookItemsEvent,
    CookItemsTypes,
    CookItemsData,
}