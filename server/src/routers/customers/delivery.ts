import { DeliveryResponse, DoorDashError, DoorDashResponse } from "@doordash/sdk";
import { Router } from "express";
import { Locals } from "../../models/general.js";
import { doorDashClient } from "../../setup/doordash.js";
import { id } from "../../utils/other/id.js";
import { customerRestaurant } from "../../middleware/customerRestaurant.js";
import { customerSession } from "../../middleware/customerSession.js";
import { getSession, getSessions, updateSession } from "../../utils/data/sessions.js";





const router = Router({ mergeParams: true });





router.put("/address", customerRestaurant({ _id: 1, locations: { _id: 1, state: 1, city: 1, line1: 1, phone: 1, postalCode: 1, }, }), customerSession({ info: { id: 1, address: 1, type: 1, location: 1, } }, { }), async (req, res) => {
    const { line1, line2, city, phone, state, postalCode, time } = req.body;
    const { restaurant, session } = res.locals as Locals;

    if(!line1 || !phone || !city || !state || !postalCode || !time) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    
    if(typeof line1 != "string" || typeof phone != "string" || typeof time != "string" || typeof city != "string" || typeof state != "string" || typeof postalCode != "string" || (line2 && typeof line2 != "string")) {
        return res.status(422).send({ reason: "InvalidInput" });
    }
    

    const date = new Date(time);

    if(!(date instanceof Date) || isNaN(date.getTime())) {
        return res.status(422).send({ reason: "InvalidTime" });
    }
    if(session.info.type != "delivery") {
        return res.status(403).send({ reason: "InvalidType" });
    }

    const getLocation = () => {
        for(const location of restaurant.locations!) {
            if(location._id?.equals(session.info.location)) {
                return location;
            }
        }
        return null;
    }

    const location = getLocation();
    if(!location) {
        return res.status(404).send({ reason: "LocationNotFound" });
    }
    if(!location.settings.customers?.allowDelivery) {
        return res.status(403).send({ reason: "DeliveryNotAllowed" });
    }

    let delivery: DoorDashResponse<DeliveryResponse>;
    const deliveryExternalId = id().toString();

    try {

        delivery = await doorDashClient.deliveryQuote({
            external_delivery_id: deliveryExternalId,
            pickup_address: `${location.line1}, ${location.city}, ${location.state}, ${location?.postalCode}`,
            pickup_phone_number: location.phone,
            dropoff_address: `${line1}, ${city}, ${state}, ${postalCode}`,
            dropoff_phone_number: phone,
            pickup_time: new Date(date.getTime() - 5 * 60000).toISOString(),
        });

    } catch (e: any) {
        const error = e as DoorDashError;
        console.log(error);
        
        if(error.errorCode == "validation_error") {
            return res.send({ updated: false, reason: "validation" });
        } else if(error.errorCode == "duplicate_delivery_id") {
            return res.status(500).send({ updated: false });
        } else {
            return res.status(500).send({ reason: "UnknownError" });
        }
    }
    

    if(!delivery!) {
        return res.status(500).send({ reason: "DeliveryNotCreated" });
    }


    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: {
            "info.delivery.phone": phone,
            "info.delivery.time": date,
            "info.delivery.address": {
                postalCode,
                state,
                line1,
                line2,
                city,
            },
            "info.delivery.externalId": deliveryExternalId,
            "payment.money.delivery": delivery.data.fee,
            "payment.money.tax": delivery.data.tax,
        } },
        { projection: { _id: 1 } },
    );




    res.send({ updated: update.ok == 1, amount: ((delivery.data.fee + (delivery.data.tax || 0)) / 100).toFixed(2) });
});
router.get("/check", customerRestaurant({ _id: 1, }), customerSession({}, {}), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;
    
    let filter = {};
    if(user) {
        filter = { "customer.customerId": user._id, "info.delivery.failed": true };
    } else {
        const generatedCustomerId = req.headers["user-session-id"];
    
        if(!generatedCustomerId || typeof generatedCustomerId != "string") {
            return res.status(401).send({
                reason: "Unauthorized"
            });
        }
        
        filter = { "customer.generatedId": id(generatedCustomerId), "info.delivery.failed": true };
    }


    const sessions = await getSessions(restaurant._id, filter, { projection: { info: { id: 1, delivery: 1, type: 1 } } }).toArray();

    const faliedDeliverySessions = [];

    for(const session of sessions) {
        if(session.info.delivery?.failed) {
            faliedDeliverySessions.push({ _id: session._id });
        }
    }


    res.send(faliedDeliverySessions);
});
router.put("/address/:sessionId", customerRestaurant({ _id: 1, locations: { _id: 1, city: 1, state: 1, line1: 1, phone: 1, postalCode: 1, } }), async (req, res) => {
    const { sessionId } = req.params;
    const { line1, line2, city, phone, state, postalCode } = req.body;
    const { restaurant } = res.locals as Locals;
    

    if(sessionId.length != 24) {
        return res.status(400).send({ reason: "InvalidSessionId" });
    }
    if(!line1 || !phone || !city || !state || !postalCode) {
        return res.status(400).send({ reason: "InvalidInput" });
    }
    if(typeof line1 != "string" || typeof phone != "string" || typeof city != "string" || typeof state != "string" || typeof postalCode != "string" || (line2 && typeof line2 != "string")) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    
    const session = await getSession(restaurant._id, { _id: id(sessionId) }, { projection: { _id: 1, info: { delivery: 1, location: 1, type: 1, id: 1 } } });

    if(!session) {
        return res.status(404).send({ reason: "SessionNotFound" });
    }

    if(session.info.type != "delivery") {
        return res.status(400).send({ reason: "InvalidSessionType" });
    }
    
    if(
        !line1 ||
        !city ||
        !phone ||
        !state ||
        !postalCode
    ) {
        console.error("DELIVERY: invalid session address");
        // DO SOMETHIG!! ADDRESS IS NOT ADDED
        return;
    };

    const getLocation = () => {
        for(const location of restaurant.locations!) {
            if(location._id.equals(session.info.location)) {
                return location;
            }
        }
        return null;
    }

    const location = getLocation();
    if(!location) {
        return res.status(404).send({ reason: "LocationNotFound" });
    }
    if(!location.settings.customers?.allowDelivery) {
        return res.status(403).send({ reason: "DeliveryNotAllowed" });
    }
    
    try {

        const delivery = await doorDashClient.deliveryQuote({
            external_delivery_id: session.info.id,
            pickup_address: `${location.line1}, ${location.city}, ${location.state}, ${location?.postalCode}`,
            pickup_phone_number: location.phone,
            dropoff_address: `${line1}, ${city}, ${state}, ${postalCode}`,
            dropoff_phone_number: phone,
        });



        return res.send({ updated: true });
    } catch (e: any) {
        const error = e as DoorDashError;
        console.log(error);
        
        if(error.errorCode == "validation_error") {

            updateSession(restaurant._id, { _id: session._id, }, { $set: { "info.delivery.failed": true, "info.delivery.failedReason": error.errorCode } }, { noResponse: true });

            

            return res.send({ updated: false, reason: "validation" });
        }

    }


});








export {
    router as DeliveryRouter,
}