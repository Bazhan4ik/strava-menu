
interface Item {
    name: string;
    price: number;
    image: any;
    _id: string;
    comment: string;
    itemObjectId: string;
    itemId: string;
}
interface OrderInfo {
    id: string;
    type: "dinein" | "takeout" | "delivery";
    comment: string;
    delivery: {
        time: Date;
        address: Address;
        phone: string;
    }
}
interface Settings {
    allowOrderingOnline: boolean;
    allowDineIn: boolean;
    allowTakeOut: boolean;
    allowDelivery: boolean;
}
interface Address {
    city: string;
    line1: string;
    line2: string;
    state: string;
    postalCode: string;
}


export {
    Settings,
    Item,
    OrderInfo,
    Address,
}