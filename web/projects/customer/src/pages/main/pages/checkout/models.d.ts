interface CheckoutItem {
    name: string;
    amount: number;
    price: number;
}
interface BillInfoMoney {
    total: string;
    subtotal: string;
    tax: string;
    taxTitle: string;
    service: string;
    tip: string;
    deliveryTip: string;
    delivery: string;
}
interface BillInfoTips {
    value10: string;
    value15: string;
    value20: string;
    selected: string;
    deliverySelected: string;
}
interface Tips {
    deliveryTip: boolean;
    tip: boolean;
    selectedTip: string;
    selectedDeliveryTip: string;
}
interface PaymentData {
    paymentMethods: PaymentMethod[];
    clientSecret: string;

    setup: boolean;
    payment: boolean;

    payWithCash: boolean;
    payWithCard: boolean;

    useElavon: boolean;
    useStripe: boolean;

    encryptionKey: string;
}
interface PaymentMethod {
    id: string;
    last4: string;
    brand: string;
}


export {
    CheckoutItem,
    BillInfoMoney,
    BillInfoTips,
    PaymentData,
    PaymentMethod,
    Tips,
}