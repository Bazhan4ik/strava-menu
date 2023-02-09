import { Time } from "global-models/time";
import { WaiterRequest } from "./waiter-request";

declare namespace WaiterRequestData {
    type add = WaiterRequest;
    type other = { sessionId: string; requestId: string; };
    type accept = { sessionId: string; time: Time; requestId: string; user: { name: string; avatar: any; } };
    type quit = { sessionId: string; requestId: string; };
    type resolve = { sessionId: string; requestId: string; };
}


type WaiterRequestTypes = "request" | "request/cancel" | "request/new" | "request/accept" | "request/quit" | "request/resolve";

interface WaiterRequestEvent {
    data: WaiterRequestData.add | WaiterRequestData.other | WaiterRequestData.accept | WaiterRequestData.quit | WaiterRequestData.resolve;
    types: WaiterRequestTypes[];
}


export {
    WaiterRequestEvent,
    WaiterRequestData,
    WaiterRequestTypes,
}