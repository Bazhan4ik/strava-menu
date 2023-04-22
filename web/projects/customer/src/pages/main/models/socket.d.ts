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


declare namespace ItemsEvent {
    interface status { 
        sessionItemId: string;
        status: string;
    }
}
type ItemsSocketEvent = Observable<SocketEvent<ItemsEvent.status>>;

declare namespace DeliveryEvent {
    interface validation { 
        sessionId: string;
    }
}
type DeliverySocketEvent = Observable<SocketEvent<DeliveryEvent.validation>>;


export {
    WaiterRequestSocketEvent,
    SocketEvent,
    WaiterRequestEvent,
    PaymentSocketEvent,
    ItemsSocketEvent,
    DeliverySocketEvent,
    ItemsEvent,
}