import { Time } from "global-models/time";
import { Observable } from "rxjs";


interface SocketEvent<T = any> {
    types: string[];
    data: T;
}


declare namespace WaiterRequestEvent {
    interface accept { 
        waiter: {
            name: string;
            avatar: any;
        };
        time: Time;
        requestId: string;
    }

    interface cancel {
        requestId: string;
    }
}
type WaiterRequestSocketEvent = Observable<SocketEvent<WaiterRequestEvent.accept>>;

declare namespace PaymentsEvent {
    interface succeeded { 
        sessionId: string;
    }
}
type PaymentSocketEvent = Observable<SocketEvent<PaymentsEvent.succeeded>>;


declare namespace DishesEvent {
    interface status { 
        sessionDishId: string;
        status: string;
    }
}
type DishesSocketEvent = Observable<SocketEvent<DishesEvent.status>>;



export {
    WaiterRequestSocketEvent,
    SocketEvent,
    WaiterRequestEvent,
    PaymentSocketEvent,
    DishesSocketEvent,
    DishesEvent,
}