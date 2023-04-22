import { Router } from "express";
import { Locals } from "../../models/general.js";
import { Location } from "../../models/restaurant.js";
import { TimelineComponent } from "../../models/session.js";
import { customerRestaurant } from "../../middleware/customerRestaurant.js";
import { customerSession } from "../../middleware/customerSession.js";
import { updateSession } from "../../utils/data/sessions.js";




const router = Router({ mergeParams: true });

router.put("/", customerRestaurant({ locations: { _id: 1, id: 1, settings: { tips: 1, } } }), customerSession({ info: { location: 1 }, payment: { money: { subtotal: 1 } } }, {}), async (req, res) => {
    const { session, restaurant } = res.locals as Locals;
    const { amount, percentage } = req.body;

    if(typeof amount != "number" || isNaN(amount) || (percentage && (typeof percentage != "number" || isNaN(percentage)))) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(!restaurant.locations) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(!session.payment?.money?.subtotal || !session.info.location) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getLocation = () => {
        for (let l of restaurant.locations!) {
            if (l._id.equals(session.info.location)) {
                return l;
            }
        }
        return null!;
    }

    const location: Location = getLocation();

    if(!location) {
        return res.status(400).send({ reason: "LocationNotFound" });
    }

    if(!location.settings.tips) {
        return res.status(403).send({ reason: "TipsDisabled" });
    }

    const timeline: TimelineComponent = {
        action: "tip/add",
        userId: "customer",
        amount: amount,
        time: Date.now(),
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "payment.money.tip": amount, "payment.selectedTipPercentage": percentage || "custom" }, $push: { timeline } },
        { projection: { _id: 1 } }
    );

    res.send({ updated: update.ok == 1 });
});
router.delete("/", customerRestaurant({}), customerSession({}, {}), async (req, res) => {
    const { session, restaurant } = res.locals as Locals;


    const timeline: TimelineComponent = {
        action: "tip/remove",
        userId: "customer",
        time: Date.now(),
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "payment.money.tip": null!, "payment.selectedTipPercentage": null! }, $push: { timeline } },
        { projection: { _id: 1 } }
    );


    res.send({ updated: update.ok == 1 });
});

router.put("/delivery", customerRestaurant({ locations: { _id: 1, id: 1, settings: { tips: 1, } } }), customerSession({ info: { location: 1 }, payment: { money: { subtotal: 1 } } }, {}), async (req, res) => {
    const { session, restaurant } = res.locals as Locals;
    const { amount, percentage } = req.body;

    if(typeof amount != "number" || isNaN(amount) || (percentage && (typeof percentage != "number" || isNaN(percentage)))) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(!restaurant.locations) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(!session.payment?.money?.subtotal || !session.info.location) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getLocation = () => {
        for (let l of restaurant.locations!) {
            if (l._id.equals(session.info.location)) {
                return l;
            }
        }
        return null!;
    }

    const location: Location = getLocation();

    if(!location) {
        return res.status(400).send({ reason: "LocationNotFound" });
    }

    if(!location.settings.tips) {
        return res.status(403).send({ reason: "TipsDisabled" });
    }

    const timeline: TimelineComponent = {
        action: "tipDelivery/add",
        userId: "customer",
        amount: amount,
        time: Date.now(),
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "payment.money.deliveryTip": amount, "payment.selectedDeliveryTipPercentage": percentage || "custom" }, $push: { timeline } },
        { projection: { _id: 1 } }
    );

    res.send({ updated: update.ok == 1 });
});
router.delete("/delivery", customerRestaurant({}), customerSession({}, {}), async (req, res) => {
    const { session, restaurant } = res.locals as Locals;


    const timeline: TimelineComponent = {
        action: "deliveryTip/remove",
        userId: "customer",
        time: Date.now(),
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "payment.money.deliveryTip": null!, "payment.selectedDeliveryTipPercentage": null! }, $push: { timeline } },
        { projection: { _id: 1 } }
    );


    res.send({ updated: update.ok == 1 });
});





export {
    router as TipRouter,
}