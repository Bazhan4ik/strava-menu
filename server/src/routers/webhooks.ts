import express, { Router } from "express";
import Stripe from "stripe";
import { id } from "../utils/id.js";
import { updateRestaurant } from "../utils/restaurant.js";
import { confirmSession } from "../utils/sessions.js";

const router = Router({ mergeParams: true });


router.post("/stripe", express.raw({ type: 'application/json' }), async (req, res) => {

    let event: Stripe.Event = req.body;



    console.log(event.type);

    if (event.type == "payment_intent.succeeded") {
        const data = event.data.object as Stripe.PaymentIntent;

        console.log(data.metadata);

        if(!data.metadata) {
            console.error("NO METADATA PAYMENT");
            return;
        }

        if(!data.metadata.restaurantId || !data.metadata.sessionId) {
            console.error("WRONG METADATA PAYMENT");
            return
        }

        const result = await confirmSession(data.metadata.restaurantId, data.metadata.sessionId, "card");
        

    } else if(event.type == "charge.failed") {
        const data = event.data.object as Stripe.Charge;

        console.log(data);

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