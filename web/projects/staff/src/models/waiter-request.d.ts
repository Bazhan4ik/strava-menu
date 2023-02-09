
interface WaiterRequest {
    requestedTime: { hours: number; minutes: number; nextMinute: number; };
    acceptedTime: { hours: number; minutes: number; nextMinute: number; };
    customer?: { name: string; avatar: any; };
    waiter?: { name: string; avatar: any; };
    sessionId: string;
    reason: string;
    total: number;
    self: boolean;
    _id: string;
    by: string;

    
    acceptedTimeout?: any;
    requestedTimeout?: any;
    acceptedInterval?: any;
    requestedInterval?: any;
}



export {
    WaiterRequest
}