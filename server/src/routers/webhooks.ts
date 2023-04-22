import express, { Router } from "express";
import Stripe from "stripe";
import { id } from "../utils/other/id.js";
import { getRestaurant, updateRestaurant } from "../utils/data/restaurant.js";
import { confirmSession, getSession, updateSession } from "../utils/data/sessions.js";
import { updateUser } from "../utils/data/users.js";
import { findDeliveryInGlobalStorage } from "../utils/data/doordash.js";
import { restaurantWorker } from "../middleware/restaurant.js";
import { sendToCooksRemoveOrder, sendToKitchenDisposeOrder, sendToWaiterAcceptWaiterRequest, sendToWaiterDeliveryStatus } from "../utils/socket/waiterRequest.js";
import { stripe } from "../setup/stripe.js";
import { addOrder } from "../utils/data/orders.js";

const router = Router({ mergeParams: true });


router.post("/stripe", express.raw({ type: 'application/json' }), async (req, res) => {

    let event: Stripe.Event = req.body;



    console.log(event.type);

    if (event.type == "payment_intent.succeeded") {


        onPaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);


    } else if (event.type == "charge.failed") {
        const data = event.data.object as Stripe.Charge;

    } else if (event.type == "setup_intent.succeeded") {
        const data = event.data.object as Stripe.SetupIntent;

        if (!data.metadata) {
            console.error("NO METADATA FOR SETUP INTENT");
            return;
        }
        if (!data.metadata.restaurantId || !data.metadata.sessionId) {
            console.error("WRONG METADATA FOR SETUP INTENT");
            return;
        }

        const result = await confirmSession({
            restaurantId: data.metadata.restaurantId,
            sessionId: data.metadata.sessionId,
            paymentMethodId: data.payment_method as string,
            payed: false,
        });

        if (data.metadata.userId) {
            const update = await updateUser({ _id: id(data.metadata.userId) }, { $set: { hasPaymentMethod: true } }, { projection: { _id: 1 } });
        }
    }


    res.send({ received: true });
});
router.post("/stripe/accounts", express.raw({ type: 'application/json' }), async (req, res) => {
    const event: Stripe.Event = req.body;

    if (event.type == "account.updated") {
        const account = event.data.object as Stripe.Account;


        console.log('Charges enabled: ' + account.charges_enabled);
        console.log('Payouts enabled: ' + account.payouts_enabled);


        if (!account.metadata?.restaurantId) {
            return res.sendStatus(400);
        }

        console.log(account.individual?.verification);
        console.log(account.individual?.requirements);


        const update = await updateRestaurant(
            { _id: id(account.metadata.restaurantId) },
            { $set: { "stripe.card": account.charges_enabled ? "enabled" : "disabled", "stripe.payouts": account.payouts_enabled ? "enabled" : "disabled" } },
            { projection: { _id: 1 } }
        );

    }


    res.send({});
});
router.post("/doordash", express.raw({ type: "application/json" }), async (req, res) => {
    const authorization = req.header("authorization");
    if (!authorization || authorization.split(" ")[1] != "3a9519823955470ea78e75d5ea3c5fa7") {
        return res.sendStatus(401);
    }

    const { event_name, external_delivery_id: deliveryId, cancellation_reason } = req.body;

    const result = await findDeliveryInGlobalStorage(deliveryId);

    if (!result) {
        console.error("DELIVERY NOT FOUND IN STORAGE");
        console.error("DELIVERY NOT FOUND IN STORAGE");
        console.error("DELIVERY NOT FOUND IN STORAGE");
        return;
    }

    if (event_name == "DELIVERY_CANCELLED") {

        /**
         *   cancel_by_dispatch	- - - - - - - - Order was cancelled by DoorDash support
         *   cancel_by_merchant	                The order was cancelled by the merchant
         *   cancel_by_order_placer	- - - - - - The order was cancelled by the person that created it
         *   customer_requested_other	        The customer cancelled the order
         *   dasher_cannot_fulfill_other  - - - The Dasher couldn't fulfill the order
         *   dasher_not_responding	            The Dasher was not responding
         *   drive_order_picked_up_by_customer  The order was picked up by the customer
         *   duplicate_order  - - - - - - - - - The order is a duplicate of another order
         *   fraudulent_order                   DoorDash suspects this order is fraudulent
         *   items_temp_unavailable	- - - - - - Items were temporarily unavailable
         *   no_available_dashers	            No Dashers are available for this order
         *   nontablet_protocol_issue - - - - - DoorDash didn't receive the full order
         *   other	                            DoorDash encountered an unknown error
         *   picked_up_by_other_dasher  - - - - Order was picked up by another dasher
         *   store_cannot_fulfill_other	        The store couldn't fulfill the order
         *   store_closed	- - - - - - - - - - The store is not available at the time the order is requested or was closed when the Dasher arrived
         *   test_order	                        The order was a test order and was cancelled by a clean-up job
         *   too_busy	- - - - - - - - - - - - The restaurant is too busy
         *   too_late	                        The order was taking too long
         *   wrong_delivery_address	- - - - - - The delivery address was incorrect
         */

        const restaurant = await getRestaurant({ _id: result.restaurantId }, { projection: { stripe: { stripeAccountId: 1 }, customers: { userId: 1 } } });

        if(!restaurant) {
            console.error("ERROR: restaurant not found, doordash webhook");
            return;
        }
        if(!restaurant.stripe?.stripeAccountId) {
            console.error("ERROR: no restaurant stripeAccountId, doordash webhook");
            return;
        }


        const session = await getSession(
            result.restaurantId,
            { _id: result.delivery.sessionId },
            { projection: { payment: { paymentIntentId: 1 }, info: { location: 1, }, items: { status: 1, }, } },
        );

        if(!session) {
            console.error("ERROR: session not found, doordash webhook");
            return;
        }
        if(!session.payment?.paymentIntentId) {
            console.error("ERROR: no session paymentIntent, doordash webhook");
            return;
        }

        let refund: Stripe.Refund;

        try {
            refund = await stripe.refunds.create({
                payment_intent: session.payment.paymentIntentId,
                reverse_transfer: true,
            });
    
        } catch (e) {
            console.error("ERROR: creating a refund");
            console.log(e);
            return res.sendStatus(500);
        }


        const addToOrders = () => {
            for(const item of session.items) {
                if(item.status != "ordered") {
                    return false;
                }
            }
            return true;
        }

        if(addToOrders()) {

            // add session to orders

            const update = await updateSession(
                result.restaurantId,
                { _id: result.delivery.sessionId, },
                { $set: {
                    "status": "removed",
                    "info.delivery.status": event_name,
                    "info.delivery.cancelledReason": cancellation_reason,
                    "payment.refundId": refund.id,
                    "items.$[].status": "removed",
                    "timing.removed.time": Date.now(),
                    "timing.removed.reason": "Delivery cancelled",
                    "timing.removed.userId": null!,
                } },
                { }
            );

            if(!update.session) {
                console.error("ERROR: adding to orders, update doesn't have a session returned");
                return;
            }


            const added = addOrder(result.restaurantId, restaurant.customers, update.session);

            sendToCooksRemoveOrder(result.restaurantId, session.info.location, { sessionId: session._id });

            return res.sendStatus(200);
        }

        // session has some dishes that have to be disposed

        sendToKitchenDisposeOrder(result.restaurantId, session.info.location, { sessionId: session._id });


        const update = await updateSession(
            result.restaurantId,
            { _id: result.delivery.sessionId, },
            { $set: {
                "info.delivery.status": event_name,
                "info.delivery.cancelledReason": cancellation_reason,
                "payment.refundId": refund.id,
                "items.$[removed].status": "removed",
                "items.$[cooking].status": "cooking:disposing",
                "items.$[cooked].status": "cooked:disposing",
            } },
            { projection: { _id: 1, info: { location: 1 } }, arrayFilters: [ { "removed.status": "ordered" }, { "cooking.status": "cooking" }, { "cooked.status": "cooked" } ] },
        );

        if(update.ok != 1 || !update.session) {
            return;
        }
        





        // refund
        // remove session
        // staff should be informed


    } else if (event_name == "DASHER_CONFIRMED") {


        const update = await updateSession(
            result.restaurantId,
            { _id: result.delivery.sessionId, },
            { $set: { "info.delivery.status": event_name } },
            { projection: { _id: 1 } },
        );


        /// CONTINUE IMPLEMENTING
        // send message to customer
        // send message to the staff

    } else if (event_name == "DASHER_CONFIRMED_PICKUP_ARRIVAL") {
        const update = await updateSession(
            result.restaurantId,
            { _id: result?.delivery.sessionId },
            { $set: { "info.delivery.status": event_name } },
            { projection: { _id: 1, info: { location: 1 } } }
        );

        if (!update.session) {
            console.error("SESSION NOT FOUND DASHER_CONFIRMED_PICKUP_ARRIVAL");
            console.error("SESSION NOT FOUND DASHER_CONFIRMED_PICKUP_ARRIVAL");
            console.error("SESSION NOT FOUND DASHER_CONFIRMED_PICKUP_ARRIVAL");
            return;
        }

        // send message to staff dasher is picking up

        sendToWaiterDeliveryStatus(result.restaurantId, update.session.info.location, { sessionId: update.session._id, deliveryStatus: "dasher confirmed pickup arrival", canBePickedUp: true });
    } else if (event_name == "DASHER_PICKED_UP") {
        const update = await updateSession(
            result.restaurantId,
            { _id: result?.delivery.sessionId },
            { $set: { "info.delivery.status": event_name } },
            { projection: { _id: 1 } }
        );

        // send message to staff, order has been delivered, then staff clicks and orders goes to orders db
    } else if (event_name == "DASHER_CONFIRMED_DROPOFF_ARRIVAL") {
        // The Dasher has confirmed that they arrived at the dropoff location 
    } else if (event_name == "DASHER_DROPPED_OFF") {
        // The Dasher has dropped off the delivery at the dropoff location and the delivery is complete.
    }


    console.log(req.body);


    res.send();
});


export {
    router as WebhookRouter
}


// 3a9519823955470ea78e75d5ea3c5fa7




async function onPaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    if (!paymentIntent.metadata) {
        console.error("NO METADATA PAYMENT");
        return;
    }

    if (!paymentIntent.metadata.restaurantId || !paymentIntent.metadata.sessionId) {
        console.error("WRONG METADATA PAYMENT");
        return
    }

    const result = await confirmSession({
        restaurantId: paymentIntent.metadata.restaurantId,
        sessionId: paymentIntent.metadata.sessionId,
        payed: true,
    });
}




// customer on checkout
// 1 not logged, pays
// 2 logged saves method to payment.paymentMethodId
// when all cooked, served paymentIntents.confirm();

// when 