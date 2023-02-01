import { ObjectId } from "mongodb";




type OrderType = "dinein" | "takeout";

/**
 * 
 * @type ordering - when user is not payed for the order yet
 * @type progress - when user payed for the order and the order has some dishes not finished yet
 * @type done - when all the dishes were cooked and served
 * @type removed - when order was removed, should have Order.removed property
 * 
 */
type OrderStatus = "ordering" | "progress" | "done" | "removed";

/**
 * 
 * @type ordered - when the dish is not cooked yet, when the customer adds dish to the session it should be "ordered" status even though the order is not confirmed yet
 * @type cooking - when a cook took the dish. cook has to click TAKE button. the dish is not cooked yet.
 * @type cooked - when the dish is cooked and is ready to be served
 * @type served - when the waiter served the dish    --    final status
 * @type removed - when someone deleted the dish. should have Dish.removed property
 * 
 */
type DishStatus = "ordered" | "cooking" | "cooked" | "served" | "removed";

/**
 * 
 * @type cash - customer wants to pay with cash
 * @type payment - customer has problems with payment USING CARD
 * @type other - other reason for the request
 * 
 */
type WaiterRequestReason = "cash" | "payment" | "other";


interface OrderDish {
    _id: ObjectId;
    dishId: ObjectId; // object id of the dish
    status: DishStatus; // status of the dish
    
    staff?: {
        cook?: ObjectId; // final cook of the dish
        waiter?: ObjectId; // final waiter of the dish
    }
    
    info: {
        comment: string; // comment the customer left for the dish
        id?: string; // for staff to track the dish easier
    }


    timing?: {
        taken?: number; // the the dish was taken to cook
        cooked?: number; // when the dish was cooked
        served?: number; // when the dish was served to the customer

        removed?: {
            time: number; // when was removed
            userId: ObjectId; // who removed
            reason: "components" | "other" | string; // what is the reason
        };
    }
}

interface OrderPayment {
    method?: "card" | "cash"; // payed by
    paymentIntentId?: string; // stripe payment intent id to not generate it everytime user is at checkout
    money?: {
        hst: number; // tax amount
        subtotal: number; // subtotal, dishes price
        total: number; // total is price of all the dishes and tax
    };
}

interface OrderTiming {
    ordered?: number; // time ordered
    connected?: number; // when user connected

    done?: {
        time: number; // when the last dish was served
        feedback?: {
            text?: string; // feedback from the customer
            rating?: number; // rating out of 5 by the customer
        };
    };

    removed?: {
        time: number; // when removed
        reason: string | "dishes"; // reason
        userId: ObjectId; // who removed
    };
}

interface OrderCustomer {
    customerId?: ObjectId | null; // customer's ObjectId
    onBehalf?: ObjectId; // waiter's ObjectId
    socketId: string; // socket id to send data

    by: "customer" | "staff"; // ordered by customer or by the staff
}

interface OrderInfo {
    type: OrderType; // is the order take out or dine in
    id: string; // can be table where the customer sits or random generated 4 digit takeout order number
    comment?: string; // comment for the order
}

interface TimelineComponent {
    action: "created" | "dish/add"; // action type
    dishId?: ObjectId;       // NOT ID OF A DISH     IT IS UNIQUE ID NOT OF THE DISH ITSELF IT IS FOR TRACKING DISH IN THE ORDER
    userId: ObjectId | "customer"; // id of a user that did an action
    time: number; // time when action happened
}

interface Order {
    _id: ObjectId;
    status: OrderStatus; // status of the order

    info: OrderInfo;
    customer: OrderCustomer;
    timing: OrderTiming;
    payment?: OrderPayment;
    
    dishes: OrderDish[]; // dishes ordered

    waiterRequests: { // all waiter requests
        reason: WaiterRequestReason; // reason why waiter was requested
        active: boolean; // true if was not answered by waiter yet
        _id: ObjectId; // id of the request
        
        requestedTime: number; // when requested
        requestCanceledTime?: number; // when canceled. if waiter is not undefined then it was canceled by customer, if waiterId exists then waiter canceled it
        requestAcceptedTime?: number; // when waiter accepted the request
        requestResolvedTime?: number; // when waiter resolved the request
        
        waiterId?: ObjectId; // id of the waiter dealing with the request

        otherWaitersId?: ObjectId[]; // all the waiters that accepted the request and then quitted it
    }[];

    timeline: TimelineComponent[];
}


export {
    Order,
    OrderDish,
    WaiterRequestReason,
    DishStatus,
    OrderStatus,
    OrderType,
    TimelineComponent,
    OrderCustomer,
    OrderInfo,
    OrderTiming,
    OrderPayment
}