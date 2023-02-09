import express, { Router } from "express";
import Stripe from "stripe";
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



export {
    router as WebhookRouter
}