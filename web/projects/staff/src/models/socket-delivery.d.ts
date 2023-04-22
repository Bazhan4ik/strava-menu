declare namespace DeliveryEventData {
    type status = { sessionId: string; deliveryStatus: string; canBePickedUp: boolean; };
    type pickedup = { sessionId: string; };
}


type DeliveryEventTypes = "delivery/status" | "delivery" | "delivery/picked-up";

interface DeliveryEvent {
    data: DeliveryEventData.status | DeliveryEventData.pickedup;
    types: DeliveryEventTypes[];
}


export {
    DeliveryEvent,
    DeliveryEventTypes,
    DeliveryEventData,
}