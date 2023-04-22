import { ObjectId } from "mongodb";




type SessionType = "dinein" | "takeout" | "delivery";

/**
 * 
 * @ordering - when user is not payed for the order yet
 * @progress - when user payed for the order and the order has some items not finished yet
 * @done - when all the items were cooked and served
 * @removed - when order was removed, should have Order.removed property
 * 
 */
type SessionStatus = "ordering" | "progress" | "done" | "removed";

/**
 * 
 * @ordered - when the item is not cooked yet, when the customer adds item to the session it should be "ordered" status even though the order is not confirmed yet
 * @cooking - when a cook took the item. cook has to click TAKE button. the item is not cooked yet.
 * @cooked - when the item is cooked and is ready to be served
 * @served - when the waiter served the item    --    final status
 * @removed - when someone deleted the item. should have item.removed property
 * 
 */
type SessionItemStatus = "ordered" | "cooking" | "cooked" | "served" | "removed" | "cooked:disposing" | "cooking:disposing" | "disposed" | "cooked";

/**
 * 
 * @type cash - customer wants to pay with cash
 * @type payment - customer has problems with payment USING CARD
 * @type other - other reason for the request
 * 
 */
type WaiterRequestReason = "cash" | "payment" | "refund" | "other";


interface SessionItem {
    _id: ObjectId;
    itemId: ObjectId; // object id of the item
    status: SessionItemStatus; // status of the item
    
    staff?: {
        cook?: ObjectId; // final cook of the item
        waiter?: ObjectId; // final waiter of the item
    }
    
    info: {
        name?: string;
        price?: number;
        comment: string; // comment the customer left for the item
        id?: string; // for staff to track the item easier
    }

    modifiers?: { _id: ObjectId; selected: ObjectId[]; }[];


    timing?: {
        taken?: number; // the the item was taken to cook
        cooked?: number; // when the item was cooked
        served?: number; // when the item was served to the customer
    };

    removed?: {
        time: number; // when was removed
        userId: ObjectId; // who removed
        reason: "ingredients" | "other" | "scam" | string; // what is the reason
    };
}

interface SessionPayment {
    method?: "card" | "cash"; // payed by
    paymentIntentId?: string; // stripe payment intent id to not generate it everytime user is at checkout
    setupIntentId?: string; // stripe setup intent id to not generate it everytime
    paymentMethodId?: string;
    refundId?: string;
    payed: boolean;
    selectedTipPercentage: number;
    selectedDeliveryTipPercentage: number;
    encryptionKey?: string;
    money?: {
        taxTitle: string; // title of the tax
        tax: number; // tax amount
        delivery: number; // tax amount
        deliveryTip: number; // tax amount
        subtotal: number; // subtotal, items price
        total: number; // total is price of all the items and tax
        service?: number; // service fee, set on restaurant's dashboard
        tip?: number; // amount of tip
    };
}

interface SessionTiming {
    ordered?: number; // time ordered
    connected?: number; // when user connected

    done?: {
        time: number; // when the last item was served
        feedback?: {
            text?: string; // feedback from the customer
            rating?: number; // rating out of 5 by the customer
        };
    };

    removed?: {
        time: number; // when removed
        reason: string | "items"; // reason
        userId: ObjectId; // who removed
    };
}

interface SessionCustomer {
    customerId?: ObjectId | null; // customer's ObjectId
    onBehalf?: ObjectId; // waiter's ObjectId
    generatedId?: ObjectId; // if user if not logged in, an id will be generated to track the user
    socketId: string; // socket id to send data

    by: "customer" | "staff"; // ordered by customer or by the staff
}

interface SessionInfo {
    type: SessionType; // is the order take out or dine in
    id: string; // can be table where the customer sits or random generated 4 digit takeout order number
    comment?: string; // comment for the order
    location: ObjectId; // location of id where the customer orders
    delivery?: {
        address?: { line1: string; line2: string; city: string; state: string; postalCode: string; }; // address for delivery
        phone?: string;  // phone number for delivery
        time: number;      // time of the delivery, doordash delivery should be created with this time - 5 minutes, so the food has to be ready by, for example, 10:30, and the delivery will be called at 10:25, so the driver will come at 10:30
        status: "DASHER_CONFIRMED" | "DASHER_CONFIRMED_PICKUP_ARRIVAL" | "DASHER_PICKED_UP" | "DASHER_CONFIRMED_DROPOFF_ARRIVAL" | "DASHER_DROPPED_OFF" | "DELIVERY_CANCELLED";
        externalId?: string;
        failed?: boolean;
        failedReason?: string;
        cancelledReason?: string;
    }
}

interface TimelineComponent {
    action: "created" | "comment" | "deliveryTip/remove" | "tipDelivery/add" | "waiterRequest/create" | "payed" | "waiterRequest/cancel" | "tip/add" | "tip/remove" | "type" | "id" | "item/add" | "item/remove" | "item/comment" | "item/modifiers" | "page"; // what action happened
    sessionItemId?: ObjectId; // id of a item ordered, add if action "item/add"
    page?: string; // if a user visited a page
    waiterRequestId?: ObjectId; // waiter request id
    userId: ObjectId | "customer"; // id of a user that did an action
    amount?: number; // amount of the tip
    time: number; // time when action happened

    collectionId?: ObjectId;
    itemId?: ObjectId;
}

interface WaiterRequest {
    reason: WaiterRequestReason; // reason why waiter was requested
    active: boolean; // true if was not answered by waiter yet
    _id: ObjectId; // id of the request
    
    requestedTime: number; // when requested
    canceledTime?: number; // when canceled. if waiter is not undefined then it was canceled by customer, if waiterId exists then waiter canceled it
    acceptedTime?: number; // when waiter accepted the request
    resolvedTime?: number; // when waiter resolved the request
    
    waiterId?: ObjectId; // id of the waiter dealing with the request

    amount?: number; // if request.reason == 'refund' amount is the amount of money to refund.

    waiters?: { waiterId: ObjectId; canceledTime: number; }[]; // all the waiters that accepted the request and then quitted it
}

interface Session {
    _id: ObjectId;
    
    status: SessionStatus; // status of the order

    info: SessionInfo;

    customer: SessionCustomer;

    timing: SessionTiming;

    payment?: SessionPayment;
    
    items: SessionItem[]; // items ordered

    waiterRequests: WaiterRequest[]; // waiter requests

    timeline: TimelineComponent[]; // timeline of the order
}


export {
    Session,
    SessionItem,
    WaiterRequestReason,
    SessionItemStatus,
    SessionStatus,
    SessionType,
    TimelineComponent,
    SessionCustomer,
    SessionInfo,
    SessionTiming,
    SessionPayment,
    WaiterRequest
}