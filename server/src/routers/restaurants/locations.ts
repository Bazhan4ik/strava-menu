import { Router } from "express";
import { Locals } from "../../models/general.js";
import { Location, LocationSettings } from "../../models/restaurant.js";
import { stripe } from "../../setup/stripe.js";
import { id } from "../../utils/other/id.js";
import { logged } from "../../middleware/auth.js";
import { restaurantWorker } from "../../middleware/restaurant.js";
import { updateRestaurant } from "../../utils/data/restaurant.js";



const router = Router({ mergeParams: true });



router.post("/", logged(), restaurantWorker({  stripe: { card: 1 } }, { locations: { adding: true } }), async (req, res) => {
    const { city, state, addressLine1, addressLine2, phone, postalCode, latlng, name } = req.body;
    const { restaurant } = res.locals as Locals;

    if(!city || !state || !addressLine1 || !postalCode || !name || !phone) {
        return res.status(400).send({ reason: "InvalidInput" });
    }
    if(typeof city != "string" || typeof state != "string" || typeof phone != "string" || phone.length != 17 || phone.slice(0, 4) != "+1 (" || typeof name != "string" || typeof addressLine1 != "string" || typeof postalCode != "string" || (addressLine2 && typeof addressLine2 != "string")) {
        return res.status(422).send({ reason: "InvalidInput" });
    }
    if(city.length < 1 || name.length < 1 || state.length < 1 || addressLine1.length < 1 || postalCode.length < 1 || (addressLine2 && addressLine2.length < 1)) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    let latlngParsed: [number, number] = null!;

    if(latlng.lat && latlng.lng && typeof latlng.lat == "number" && typeof latlng.lng == "number") {
        latlngParsed = [latlng.lat, latlng.lng];
    }

    const $push: any = {
        locations: <Location>{
            postalCode: postalCode,
            latlng: latlngParsed!,
            line1: addressLine1,
            line2: addressLine2,
            country: "CA",
            state: state,
            city: city,
            phone: phone,

            settings: {
                customers: {
                    allowOrderingOnline: true,
                    allowDelivery: false,
                    allowTakeOut: false,
                    allowDineIn: true,
                    maxItems: 0,
                },
                methods: {
                    card: restaurant.stripe?.card == "enabled",
                    cash: true,
                },
                serviceFee: null,
                tips: true,
            },

            id: name.replace(/[^\w\s]/gi, "").replace(/\s/g, "-").toLowerCase(),
            name: name,
            _id: id(),
        }
    };

    const $set: any = {};
    $set[`tables.${$push.locations.id}`] = [];

    const result = await updateRestaurant(
        { _id: restaurant._id },
        {
            $push, 
            $set,
        },
        { projection: { _id: 1 } }
    );


    res.send({ updated: result.ok == 1 });
});

router.get("/", logged(), restaurantWorker({ locations: 1 }, { locations: { available: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;

    if(!restaurant.locations) {
        return res.send([]);
    }


    res.send(restaurant.locations);
});

router.get("/:locationId", logged(), restaurantWorker({ locations: 1 }, { locations: { available: true } }), async (req, res) => {
    const { locationId } = req.params;
    const { restaurant } = res.locals as Locals;


    if(!locationId) {
        return res.status(400).send({ reason: "NoLocationId" });
    }

    if(!restaurant.locations || restaurant.locations.length == 0) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    let location: Location = null!;

    for(let l of restaurant.locations) {
        if(l.id == locationId) {
            location = l;
            break;
        }
    }

    if(!location) {
        return res.status(404).send({ reason: "LocationNotFound" });
    }


    res.send(location);
});

router.put("/:locationId/methods", logged(), restaurantWorker({ stripe: { card: 1, stripeAccountId: 1, }, locations: { id: 1, settings: { methods: 1 } } }, { locations: { adding: true } }), async (req, res) => {
    const { locationId } = req.params;
    const { restaurant } = res.locals as Locals;
    const { value, type } = req.body;

    if(!type) {
        return res.status(400).send({ reason: "InvalidInput" });
    }
    if(typeof value != "boolean" || !["cash", "card"].includes(type)) {
        return res.status(422).send({ reason: "InvalidInput" });
    }
    if(!restaurant.stripe || !restaurant.stripe.card) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    if(!restaurant.locations || restaurant.locations.length == 0) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(type == "card" && value === true && restaurant.stripe?.card != "enabled") {
        
        if(!restaurant.stripe.stripeAccountId) {
            res.status(403).send({ reason: "NotVerified" });
            return;
        }

        const account = await stripe.accounts.retrieve(restaurant.stripe.stripeAccountId);

        console.log(account);

        if(!account) {
            res.status(403).send({ reason: "NotVerified" });
            return;
        }

        updateRestaurant(
            { _id: restaurant._id },
            { $set: { "stripe.card": account.charges_enabled ? "enabled" : "disabled", "stripe.payouts": account.payouts_enabled ? "enabled" : "disabled" } },
            { projection: { _id: 1 } }
        );

        if(!account.charges_enabled) {
            res.status(403).send({ reason: "NotVerified" });
            return;
        }
    }


    let location: Location = null!;

    for(let l of restaurant.locations) {
        if(l.id == locationId) {
            location = l;
            break;
        }
    }

    if(!location) {
        return res.status(404).send({ reason: "LocationNotFound" });
    }

    if(!location.settings?.methods) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(location.settings.methods[type as ("cash" | "card")] == value) {
        return res.send({ updated: false });
    }

    const $set: any = {};

    $set[`locations.$[location].settings.methods.${type}`] = value;

    const update = await updateRestaurant(
        { _id: restaurant._id },
        { $set },
        { arrayFilters: [ { "location.id": locationId } ], projection: { _id: 1 } }
    );

    res.send({ updated: update.ok == 1 });
});
router.put("/:locationId/customers", logged(), restaurantWorker({ locations: { id: 1, settings: { customers: 1 } } }, { locations: { adding: true } }), async (req, res) => {
    const { locationId } = req.params;
    const { restaurant } = res.locals as Locals;
    const { value, type } = req.body;

    if(!type) {
        return res.status(400).send({ reason: "InvalidInput" });
    }
    if(typeof value != "boolean" || !["allowDineIn", "allowTakeOut", "allowDelivery"].includes(type)) {
        return res.status(422).send({ reason: "InvalidInput" });
    }
    if(!restaurant.locations || restaurant.locations.length == 0) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    let location: Location = null!;

    for(let l of restaurant.locations) {
        if(l.id == locationId) {
            location = l;
            break;
        }
    }

    if(!location) {
        return res.status(404).send({ reason: "LocationNotFound" });
    }

    if(!location.settings?.customers) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(location.settings.customers[type as keyof LocationSettings["customers"]] == value) {
        return res.send({ updated: false });
    }

    const $set: any = {};

    $set[`locations.$[location].settings.customers.${type}`] = value;

    const update = await updateRestaurant(
        { _id: restaurant._id },
        { $set },
        { arrayFilters: [ { "location.id": locationId } ], projection: { _id: 1 } }
    );

    res.send({ updated: update.ok == 1 });
});

router.put("/:locationId/service-fee", logged(), restaurantWorker({ locations: { id: 1, settings: { serviceFee: 1 } } }, { locations: { adding: true } }), async (req, res) => {
    const { locationId } = req.params;
    const { restaurant } = res.locals as Locals;
    const { enabled, amount, type } = req.body;

    if(!type) {
        return res.status(400).send({ reason: "InvalidInput" });
    }
    if(typeof enabled != "boolean" || ![1, 2].includes(type) || typeof amount != "number") {
        return res.status(422).send({ reason: "InvalidInput" });
    }
    if(!restaurant.locations || restaurant.locations.length == 0) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    let location: Location = null!;

    for(let l of restaurant.locations) {
        if(l.id == locationId) {
            location = l;
            break;
        }
    }

    if(!location) {
        return res.status(404).send({ reason: "LocationNotFound" });
    }

    const serviceFee = {
        amount: type == 1 ? amount * 100 : amount,
        type,
    }

    const $set: any = {};

    $set[`locations.$[location].settings.serviceFee`] = enabled ? serviceFee : null;

    const update = await updateRestaurant(
        { _id: restaurant._id },
        { $set },
        { arrayFilters: [ { "location.id": locationId } ], projection: { _id: 1 } }
    );

    res.send({ updated: update.ok == 1, old: location.settings.serviceFee });
});

router.put("/:locationId/tips", logged(), restaurantWorker({ locations: { id: 1, settings: { tips: 1 } } }, { locations: { adding: true } }), async (req, res) => {
    const { locationId } = req.params;
    const { restaurant } = res.locals as Locals;
    const { value } = req.body;


    if(typeof value != "boolean") {
        return res.status(422).send({ reason: "InvalidInput" });
    }
    if(!restaurant.locations || restaurant.locations.length == 0) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    let location: Location = null!;

    for(let l of restaurant.locations) {
        if(l.id == locationId) {
            location = l;
            break;
        }
    }

    if(!location) {
        return res.status(404).send({ reason: "LocationNotFound" });
    }

    if(location.settings.tips == value) {
        return res.send({ updated: true });
    }

    const update = await updateRestaurant(
        { _id: restaurant._id },
        { $set: { "locations.$[location].settings.tips": value } },
        { arrayFilters: [ { "location.id": locationId } ], projection: { _id: 1 } }
    );

    res.send({ updated: update.ok == 1, });
});



router.delete("/:locationId", logged(), restaurantWorker({ }, { locations: { removing: true } }), async (req, res) => {
    const { locationId } = req.params;
    const { restaurant } = res.locals as Locals;

    const $unset: any = {};

    $unset[`tables.${locationId}`] = 1;

    const update = await updateRestaurant({ _id: restaurant._id }, { $unset, $pull: { locations: { id: locationId } } }, { projection: { _id: 1 } });


    res.send({ updated: update.ok == 1 });
});



export {
    router as LocationsRouter,
}