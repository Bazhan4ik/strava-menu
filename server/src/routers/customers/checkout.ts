import { Router } from "express";
import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { Locals } from "../../models/general.js";
import { Location } from "../../models/restaurant.js";
import { SessionItem } from "../../models/session.js";
import { stripe } from "../../setup/stripe.js";
import { getItems } from "../../utils/data/items.js";
import { customerRestaurant } from "../../middleware/customerRestaurant.js";
import { customerSession } from "../../middleware/customerSession.js";
import { confirmSession, updateSession } from "../../utils/data/sessions.js";
import crypto from "crypto";
import CryptoJS from "crypto-js";
import qs from "querystring";
import axios from "axios";



const router = Router({ mergeParams: true });




class AmountAndItemes {
    money!: { subtotal: number; deliveryTip: number; tax: number; delivery: number; taxTitle: string; total: number; tip: number; service: number; };
    items!: { name: string; amount: number; price: number; }[];
}
class ErrorResult {
    status!: number;
    reason!: string;
}
class SuccessfulPaymentDataResult {
    paymentIntentId!: string;
    paymentIntentClientSecret!: string;
    setupIntentClientSecret?: string;
    setupIntent?: string;
    paymentMethods?: {
        last4: string;
        id: string;
        brand: string;
    }[];
}
interface Response {
    items: { name: string; amount: number; price: number; }[],
    money: {
        tax: string,
        subtotal: string,
        tip: string,
        deliveryTip: string,
        service: string,
        total: string,
        delivery: string,
        taxTitle: string,
    },
    country: string,
    email: string,

    tips: {
        selectedTip: number;
        selectedDeliveryTip: number;
        tip: boolean;
        deliveryTip: boolean;
    }


    paymentData: {
        paymentMethods: { last4: string; id: string; brand: string; }[];
        clientSecret: string;

        setup: boolean;
        payment: boolean;

        payWithCard: boolean;
        payWithCash: boolean;

        useElavon: boolean;
        useStripe: boolean;

        encryptionKey: string;
    }
}
router.get("/",
    customerRestaurant({
        stripe: { stripeAccountId: 1, },
        locations: { _id: 1, settings: 1, country: 1, state: 1 },
    }),
    customerSession(
        {
            payment: 1,
            info: 1,
            items: { itemId: 1, _id: 1, modifiers: 1, },
        },
        {
            stripeCustomerId: 1,
            hasPaymentMethod: 1,
            info: { email: 1, },
        }
    ), async (req, res) => {

        const { session, restaurant, user } = res.locals as Locals;

        const getLocation = () => {
            for (const location of restaurant!.locations!) {
                if (location._id.equals(session.info.location)) {
                    return location;
                }
            }
            return null;
        }
        const findError = () => {
            if (!restaurant.locations) {
                return { status: 500, reason: "InvalidError" };
            }
            if (!restaurant.stripe || !restaurant.stripe.stripeAccountId) {
                return { status: 500, reason: "InvalidError" };
            }
            for (let l of restaurant.locations) {
                if (l._id.equals(session.info.location)) {
                    location = l;
                    break;
                }
            }
            if (!location) {
                return { status: 404, reason: "LocationNotFound" };
            }
            if (
                (session.info.type == "delivery" && !location.settings.customers?.allowDelivery) ||
                (session.info.type == "takeout" && !location.settings.customers?.allowTakeOut) ||
                (session.info.type == "dinein" && !location.settings.customers?.allowDineIn)
            ) {
                return { status: 403, reason: "InvalidOrderType" };
            }

            if (session.info.type == "delivery") {
                if (
                    !session.info.delivery?.address?.city ||
                    !session.info.delivery.address.line1 ||
                    !session.info.delivery.address.state ||
                    !session.info.delivery.address.postalCode ||
                    !session.info.delivery.phone
                ) {
                    return { status: 403, reason: "InvalidDeliveryAddress" };
                }
            }
        }
        const convertItemesAndCalculateMoney = async () => {
            if (session.items.length == 0) {
                return { status: 500, reason: "InvalidItemes" };
            }
            const result = await calculateAmount({
                restaurantId: restaurant._id,
                ds: session.items,
                tipPercentage: session.payment?.selectedTipPercentage || 0,
                tip: session.payment?.money?.tip || 0,
                serviceFee: location.settings.serviceFee!,
                delivery: (session.payment?.money?.delivery || 0),
                location: { country: location.country!, state: location.state!, },
                deliveryTipPecentage: session.payment?.selectedDeliveryTipPercentage || 0,
                deliveryTip: session.payment?.money?.deliveryTip || 0,
            });

            if (!result) {
                return { status: 500, reason: "InvalidItemes" };
            }
            if (!result || !result.money.total) {
                return { status: 403, reason: "InvalidAmount" };
            }
            return result;
        }
        const customerPaymentData = async (): Promise<SuccessfulPaymentDataResult | ErrorResult | null> => {

            const waitFor = [];

            // create payment intent
            // if customer has account list his payment methods
            // if no payment methods create setup intent

            // if customer has no accounts return payment intent client secret
            // if customer logged in return payment methods 

            // if customer want not to pay with the given methods create setup intent on other endpoint

            waitFor.push(createPaymentIntent(
                {
                    stripeAccountId: restaurant.stripe!.stripeAccountId!,
                    delivery: money.delivery + (money.deliveryTip || 0),
                    stripeCustomerId: user?.stripeCustomerId,
                    restaurantId: restaurant._id.toString(),
                    pid: session.payment?.paymentIntentId,
                    sessionId: session._id.toString(),
                    total: Math.floor(money.total),
                },
            ));

            if (!user) {

                // customer not logged in, create/update payment intent

                const result = await Promise.all(waitFor); // [0] paymentIntent

                const paymentIntent = result[0];

                if (!paymentIntent) {
                    return null;
                }

                return { paymentIntentClientSecret: paymentIntent.client_secret!, paymentIntentId: paymentIntent.id };
            }

            if (user.hasPaymentMethod) {

                // list saved payment methods

                waitFor.push(
                    stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: "card" })
                );

                const result = await Promise.all(waitFor); // [0] paymentIntent [1] paymentMethods

                const paymentIntent = result[0] as Stripe.PaymentIntent;
                const paymentMethods = result[1] as Stripe.ApiList<Stripe.PaymentMethod>;

                const convertedPaymentMethods: SuccessfulPaymentDataResult["paymentMethods"] = [];

                for (let pm of paymentMethods.data) {
                    convertedPaymentMethods.push({
                        id: pm.id,
                        last4: pm.card?.last4!,
                        brand: pm.card?.brand!,
                    });
                }

                if (!paymentIntent) {
                    return null;
                }


                return { paymentMethods: convertedPaymentMethods, paymentIntentClientSecret: paymentIntent.client_secret!, paymentIntentId: paymentIntent.id, };
            }

            // create setup intent

            if (session.payment?.setupIntentId) {
                waitFor.push(
                    stripe.setupIntents.retrieve(session.payment.setupIntentId)
                );
            } else {
                waitFor.push(
                    stripe.setupIntents.create({
                        customer: user.stripeCustomerId,
                        payment_method_types: ["card"],
                        metadata: {
                            restaurantId: restaurant._id.toString(),
                            sessionId: session._id.toString(),
                            userId: user._id.toString(),
                        }
                    })
                );
            }


            const result = await Promise.all(waitFor); // [0] paymentIntent [1] setupIntent

            const paymentIntent = result[0] as Stripe.PaymentIntent;
            const setupIntent = result[1] as Stripe.SetupIntent;

            if (!paymentIntent) {
                return null;
            }

            setupIntent.client_secret;
            paymentIntent.client_secret;

            return {
                paymentIntentClientSecret: paymentIntent.client_secret!,
                setupIntentClientSecret: setupIntent.client_secret!,
                paymentIntentId: paymentIntent.id,
                setupIntent: setupIntent.id,
            }

        }


        let location: Location = null!;
        let money: AmountAndItemes["money"] = null!;
        let items: AmountAndItemes["items"] = null!;
        let itemsUpdate: any = null!;
        let itemsArrayFilter: any = null!;
        let paymentData: SuccessfulPaymentDataResult = null!;
        let encryptionKey = crypto.randomBytes(32).toString("hex");

        const error = findError();
        if (error) {
            return res.status(error.status).send({ reason: error.reason });
        }

        location = getLocation()!;
        if (!location) {
            return res.status(404).send({ reason: "LocationNotFound" });
        } else if (!location.state || !location.country) {
            return res.status(500).send({ reason: "InvalidError" });
        }

        const calcres = await convertItemesAndCalculateMoney();
        if (calcres instanceof ErrorResult || (typeof (calcres as any).status == "number")) {
            return res.status((calcres as ErrorResult).status || 500).send({ reason: (calcres as ErrorResult).reason || "InvalidError" })
        } else {
            money = (calcres as any).money;
            items = (calcres as any).items;
            itemsArrayFilter = (calcres as any).itemsArrayFilter;
            itemsUpdate = (calcres as any).itemsUpdate;
        }

        if (location.settings.methods?.card) {
            const result = await customerPaymentData();
            if (!result) {
                return res.status(403).send({ reason: "PaymentState" });
            }
            if (result instanceof ErrorResult) {
                return res.status(result.status).send({ reason: result.reason });
            }
            paymentData = result;
        }

        let response: Response = {
            money: {
                tax: (money.tax / 100).toFixed(2),
                subtotal: (money.subtotal / 100).toFixed(2),
                tip: money.tip ? (money.tip / 100).toFixed(2) : null!,
                deliveryTip: money.deliveryTip ? (money.deliveryTip / 100).toFixed(2) : null!,
                service: money.service ? (money.service / 100).toFixed(2) : null!,
                total: (money.total / 100).toFixed(2),
                delivery: money.delivery ? (money.delivery / 100).toFixed(2) : null!,
                taxTitle: money.taxTitle,
            },
            items,
            country: location.country,
            email: user?.info?.email!,

            tips: {
                selectedTip: session.payment?.selectedTipPercentage!,
                selectedDeliveryTip: session.payment?.selectedDeliveryTipPercentage!,
                tip: location.settings.tips,
                deliveryTip: session.info.type == "delivery",
            },


            paymentData: {
                paymentMethods: paymentData?.paymentMethods!,
                clientSecret: paymentData?.paymentIntentClientSecret,

                setup: false,
                payment: true,

                payWithCard: location.settings.methods?.card!,
                payWithCash: location.settings.methods?.cash! && session.info.type != "takeout" && session.info.type != "delivery",

                useStripe: false,
                useElavon: true,

                encryptionKey: encryptionKey,
            }
        };

        res.send(response);


        const update = await updateSession(restaurant._id,
            { _id: session._id, },
            {
                $set: {
                    "payment.paymentIntentId": paymentData?.paymentIntentId,
                    "payment.setupIntentId": paymentData?.setupIntent,
                    "payment.encryptionKey": encryptionKey,
                    ...itemsUpdate,
                    "payment.money.total": money.total,
                    "payment.money.service": money.service,
                    "payment.money.tax": money.tax,
                    "payment.money.taxTitle": money.taxTitle,
                    "payment.money.tip": money.tip,
                    "payment.money.subtotal": money.subtotal,
                }
            },
            { projection: { _id: 1 }, arrayFilters: itemsArrayFilter }
        );
    });


router.post("/elvn/pay", customerRestaurant({}), customerSession({ payment: { encryptionKey: 1, money: { total: 1 } } }, {}), async (req, res) => {
    const { restaurant, session } = res.locals as Locals;
    const { cardData } = req.body;

    if (!cardData || typeof cardData != "string") {
        return res.status(400).send({ reason: "InvalidInput", message: "card data" });
    }
    if (!session.payment?.encryptionKey) {
        return res.status(403).send({ reason: "EncKey", message: "encryption key" });
    }
    if (!session.payment.money?.total) {
        return res.status(500).send({ reason: "InvalidError", message: "amount" });
    }

    const result = decrypt(cardData, session.payment.encryptionKey);

    if (!result) {
        return res.status(500).send({ reason: "InvalidError", message: "descryption" });
    }

    const { number: cardNumber, exp: expiryDate, cvc: cvv, postalCode }: { number: string; exp: string; cvc: string; postalCode: string; } = JSON.parse(result);



    const merchantId = '0022797';
    const userId = 'apiuser';
    const pin = 'RNKZ6V4NMA4LX4AXUM381FT7POL4LRX3AJLMY6XVKF6BJGIYK4LWX6QGB63RM2QW';

    // const cardNumber = '4000000000000002';
    // const expiryDate = '04/25';
    // const cvv = '123';

    console.log("NUMBER: ", cardNumber);
    console.log("EXPIRY: ", expiryDate);
    console.log("CVV: ", cvv);


    const transactionAmount = (session.payment.money.total / 100).toFixed(2);

    console.log(transactionAmount);


    try {
        const data = qs.stringify({
            ssl_merchant_id: merchantId,
            ssl_user_id: userId,
            ssl_pin: pin,
            ssl_transaction_type: 'ccsale',
            ssl_card_number: cardNumber,
            ssl_exp_date: expiryDate,
            ssl_cvv2cvc2: cvv,
            ssl_amount: transactionAmount,
            ssl_show_form: 'false',
            ssl_result_format: 'ASCII',
            ssl_avs_zip: postalCode,
        });

        const response = await axios.post('https://demo.convergepay.com/VirtualMerchantDemo/process.do', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const result = qs.parse(response.data, '\n', '=');

        console.log(result);

        if (!result.ssl_result || typeof result.ssl_result != "string") {
            return res.status(400).send({ reason: "InvalidError", message: "ssl_result doesn't exist or not a string" });
        }

        if (result.ssl_result == "0") {
            confirmSession({
                restaurantId: restaurant._id,
                sessionId: session._id,
                payed: true
            });

            res.send({ success: true });
            return;
        } else if (result.ssl_result == "1") {
            res.status(400).send({ reason: "PaymentFailed" });

            switch (result.ssl_result_message) {
                case "APPROVAL":
                    // AA - Approved
                    break;
                case "APPROBAT":
                    // AA - Approved (French)
                    break;
                case "PARTIAL APPROVAL":
                    // AP - Approved for a Partial Amount
                    break;
                case "DECLINE CVV2":
                    // N7 - Do not honor due to CVV2 mismatch/failure
                    break;
                case "PICK UP CARD":
                    // NC - Pick up card
                    break;
                case "AMOUNT ERROR":
                    // ND - Tran Amount Error
                    break;
                case "AMT OVER SVC LMT":
                    // ND - Amount is more than established service limit
                    break;
                case "APPL TYPE ERROR":
                    // ND - Call support for help with this error
                    break;
                case "CANNOT CONVERT":
                    // ND - Check is ok, but cannot convert. Do Not Honor
                    break;
                case "DECLINED":
                    // ND - Do Not Honor
                    break;
                case "DECLINED T4":
                    // ND - Do Not Honor. Failed negative check, unpaid items
                    break;
                case "DECLINED-HELP 9999":
                    // ND - System Error
                    break;
                case "DUP CHECK NBR":
                    // ND - Duplicate Check Number
                    break;
                case "EXPIRED CARD":
                    // ND - Expired Card
                    break;
                case "INCORRECT PIN":
                    // ND - Invalid PIN
                    break;
                case "INVALID CARD":
                    // ND - Invalid Card
                    break;
                case "INVALID CAVV":
                    // ND - Invalid Cardholder Authentication Verification Value
                    break;
                case "INVALID TERM ID":
                    // ND - Invalid Terminal ID
                    break;
                case "INVLD R/T NBR":
                    // ND - Invalid Routing/Transit Number
                    break;
                case "INVLD TERM ID 1":
                    // ND - Invalid Merchant Number
                    break;
                case "INVLD TERM ID 2":
                    // ND - Invalid SE Number
                    break;
                case "INVLD VOID DATA":
                    // ND - Invalid Data Submitted for Void Transaction
                    break;
                case "MAX MONTHLY VOL":
                    // ND - This transaction would go over the maximum monthly volume
                    break;
                case "MICR ERROR":
                    // ND - MICR Read Error
                    break;
                case "MUST SETTLE MMDD":
                    // ND - Must settle, open batch is over 7 days old. Best Practice is to settle within 24 hours. Batch will be Auto Settled after 10 days
                    break;
                case "NETWORK ERROR":
                    // ND - General System Error
                    break;
                case "PLEASE RETRY":
                    // ND - Please Retry/Reenter Transaction
                    break;
                case "RECORD NOT FOUND":
                    // ND - Record not on the network
                    break;
                case "REQ. EXCEEDS BAL.":
                    // ND - Req. exceeds balance
                    break;
                case "SEQ ERR PLS CALL":
                    // ND - Call support for help with this error
                    break;
                case "SERV NOT ALLOWED":
                    // ND - Invalid request
                    break;
                case "TOO MANY CHECKS":
                    // ND - Too many checks (Over Limit)
                    break;
                case "CALL AUTH. CENTER":
                    // NR - Refer to Issuer
                    break;
                case "SUCCESS":
                    // N/A - For successfully added, updated, deleted recurring or installment transactions
                    break;
                case "ERROR":
                    // N/A - Recurring or installment transactions could not update.
                    break;
                default:
                    // Handle the case where the code_long value is not recognized
                    break;
            }

            return;
        }
    } catch (error: any) {
        console.error('Error processing payment:', error.message);
    }

    res.status(500).send({ reason: "InvalidError", message: "after try/catch" });
});





export {
    router as CheckoutRouter,
}




/**
 * 
 * @param restaurantId 
 * @param ds - selected items, should be provided to get items' prices and calculate money
 * @param tipPercentage - if tip added, and tip is some percents it should be recalculated because of new items could be added or removed
 * @param tip - amount of tip, if it was custom, it will not be recalculated
 * @param serviceFee - restaurant's service fee
 * @returns AmountAndItemes || ErrorResult
 */
async function calculateAmount(data: {
    serviceFee?: { amount: number; type: 1 | 2 };
    location: { country: string; state: string; };
    deliveryTipPecentage: number;
    restaurantId: ObjectId;
    tipPercentage: number;
    deliveryTip: number;
    delivery: number;
    ds: SessionItem[];
    tip: number;
}) {

    const { restaurantId, deliveryTip, ds, delivery, tipPercentage, tip, serviceFee, location, deliveryTipPecentage } = data;

    const itemsId: ObjectId[] = [];


    for (let item of ds) {
        itemsId.push(item.itemId);
    }

    const items = await getItems(restaurantId, { _id: { $in: itemsId } }, { projection: { modifiers: { _id: 1, options: { _id: 1, price: 1, } }, info: { price: 1, name: 1, }, } }).toArray();


    const findItem = (itemId: ObjectId) => {
        for (let item of items) {
            if (item._id.equals(itemId)) {
                return item;
            }
        }
        return null!;
    }
    const getTax = (subtotal: number) => {
        let tax: number = null!;
        let title: string = null!;

        if (location.country == "CA" || location.country == "ca") {
            // AB - Alberta
            // ON - Ontario
            // BC - British Columbia
            // MB - Manitoba
            // NB - New Brunswick
            // NL - Newfoundland and Labrador
            // NT - Northwest Territories
            // NS - Nova Scotia
            // NU - Nanavut
            // PE - Prince Edward Island
            // QC - Quebec
            // SK - Saskatchewan
            // YT - Yukon

            if (location.state == "ON") {
                title = "HST";
                tax = 0.13;
            } else if (["AB", "NT", "NU", "YT"].includes(location.state)) {
                title = "GST";
                tax = 0.05;
            } else if (location.state == "QC") {
                title = "GST + QST";

                // GST - %5
                // QST - %9.975
                tax = 0.14975;
            } else if (location.state == "BC" || location.state == "MB") {
                title = "GST + PST";
                tax = 0.12;
            } else if (location.state == "NB" || location.state == "NL" || location.state == "NS" || location.state == "PE") {
                title = "HST";
                tax = 0.15;
            } else if (location.state == "SK") {
                title = "GST + PST";
                tax = 0.11;
            }
        } else {
            return null;
        }

        return { tax: subtotal * tax, title };
    }

    let subtotal = 0;
    const itemsUpdate: any = {};
    const itemsArrayFilter = [];

    const map = new Map<string, { name: string; amount: number; price: number; }>();

    for (let sessionItem of ds) {

        const arrayFilter: any = {};
        arrayFilter[`item${sessionItem._id}._id`] = sessionItem._id;
        itemsArrayFilter.push(arrayFilter);

        const item = findItem(sessionItem.itemId);

        if (!item) {
            return null;
        }

        if (map.has(item._id.toString())) {
            const entry = map.get(item._id.toString())!;

            map.set(item._id.toString(), { ...entry, price: entry.price + item.info.price, amount: entry.amount + 1 });
        } else {
            map.set(item._id.toString(), { name: item.info.name, price: item.info.price, amount: 1 });
        }

        if (item.modifiers && sessionItem.modifiers) {
            let modifierPrice = 0;
            for (const sessionItemModifier of sessionItem.modifiers) {
                for (const modifier of item.modifiers!) {
                    if (modifier._id.equals(sessionItemModifier._id)) {
                        for (const sdmo of sessionItemModifier.selected) {
                            for (const modifierOption of modifier.options) {
                                if (sdmo.equals(modifierOption._id)) {
                                    subtotal += modifierOption.price;
                                    modifierPrice += modifierOption.price;
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }

            }
            itemsUpdate[`items.$[item${sessionItem._id}].info.price`] = item.info.price + modifierPrice;
        }



        subtotal += item.info.price;
    }

    const tax = getTax(subtotal);

    if (!tax) {
        return null;
    }


    const service = serviceFee ? serviceFee?.type == 1 ? serviceFee.amount : subtotal * serviceFee.amount / 100 : null!;
    const tipAmount = tipPercentage ? calculateTip(subtotal, tipPercentage) : null!;
    const deliveryTipAmount = deliveryTipPecentage ? calculateTip(subtotal, deliveryTipPecentage) : null!;
    const total = tax.tax + subtotal + (service || 0) + (tipAmount || tip) + delivery + (deliveryTipAmount || deliveryTip);

    return {
        money: {
            subtotal: Math.ceil(subtotal),
            tax: Math.ceil(tax.tax),
            total: Math.ceil(total),
            service: Math.ceil(service),
            tip: Math.ceil(Math.floor(tipAmount || tip)),
            taxTitle: tax.title,
            delivery,
            deliveryTip: Math.ceil(Math.floor(deliveryTipAmount || deliveryTip))
        },
        itemsUpdate,
        itemsArrayFilter,
        items: Array.from(map.values()),
    };
}

async function createPaymentIntent(data: {
    stripeCustomerId?: string;
    stripeAccountId: string;
    restaurantId: string;
    sessionId: string;
    delivery?: number;
    total: number;
    pid?: string;
}) {
    const { pid, total, delivery, stripeAccountId, stripeCustomerId, sessionId, restaurantId } = data;

    let deliveryAmount = 0;
    if (delivery) {
        deliveryAmount += Math.ceil(delivery);
    }

    if (pid) {


        try {
            const paymentIntent = await stripe.paymentIntents.update(pid, { amount: Math.floor(total), application_fee_amount: deliveryAmount });

            return paymentIntent;
        } catch (e: any) {
            console.error("at session.ts createPaymentIntent() update");
            console.log(e);
            if (e.raw.code == "payment_intent_unexpected_state") {
                return null!;
            }
            return null;
        }

    } else {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.floor(total),
                on_behalf_of: stripeAccountId,
                currency: "cad",
                customer: stripeCustomerId || undefined,
                application_fee_amount: deliveryAmount,
                transfer_data: {
                    destination: stripeAccountId,
                },
                metadata: {
                    sessionId,
                    restaurantId
                }
            });



            return paymentIntent;
        } catch (e) {
            console.error("at session.ts createPaymentIntent() create");
            throw e;
        }
    }
}


/**
 * 
 * @param amount amount of the tip, for example $5 would be 500 cents 
 * @param percentage percentage of the tip. should be saved so then when checkout reloaded tip option will be selected
 * @returns the tip amount which is % 25 == 0
 */
function calculateTip(amount: number, percentage: number): number {
    const result = amount * (percentage / 100);
    const remainder = result % 25;

    return result - remainder;
}






function decrypt(encrypted: string, key: string): string | null {
    try {
        const decrypted = CryptoJS.AES.decrypt(encrypted, key);
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Error decrypting data:', error);
        return null;
    }
}