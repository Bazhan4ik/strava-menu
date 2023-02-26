import express, { Router } from "express";
import Stripe from "stripe";
import { id } from "../utils/id.js";
import { updateRestaurant } from "../utils/restaurant.js";
import { confirmSession } from "../utils/sessions.js";
import { updateUser } from "../utils/users.js";

const router = Router({ mergeParams: true });


router.post("/stripe", express.raw({ type: 'application/json' }), async (req, res) => {

    let event: Stripe.Event = req.body;



    console.log(event.type);

    if (event.type == "payment_intent.succeeded") {


        onPaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        

    } else if(event.type == "charge.failed") {
        const data = event.data.object as Stripe.Charge;

    } else if(event.type == "setup_intent.succeeded") {
        const data = event.data.object as Stripe.SetupIntent;

        if(!data.metadata) {
            console.error("NO METADATA FOR SETUP INTENT");
            return;
        }
        if(!data.metadata.restaurantId || !data.metadata.sessionId) {
            console.error("WRONG METADATA FOR SETUP INTENT");
            return;
        }

        const result = await confirmSession({
            restaurantId: data.metadata.restaurantId,
            sessionId: data.metadata.sessionId,
            paymentMethodId: data.payment_method as string,
            payed: false,
        });

        if(data.metadata.userId) {
            const update = await updateUser({ _id: id(data.metadata.userId) }, { $set: { hasPaymentMethod: true } }, { projection: { _id: 1 } });
        }
    }


    res.send({ received: true });
});
router.post("/stripe/accounts", express.raw({ type: 'application/json' }), async (req, res) => {
    const event: Stripe.Event = req.body;

    if(event.type == "account.updated") {
        const account = event.data.object as Stripe.Account;


        console.log('Charges enabled: ' + account.charges_enabled);
        console.log('Payouts enabled: ' + account.payouts_enabled);


        if(!account.metadata?.restaurantId) {
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



export {
    router as WebhookRouter
}





async function onPaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    if(!paymentIntent.metadata) {
        console.error("NO METADATA PAYMENT");
        return;
    }

    if(!paymentIntent.metadata.restaurantId || !paymentIntent.metadata.sessionId) {
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