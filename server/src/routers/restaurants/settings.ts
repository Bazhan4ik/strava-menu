import { Router } from "express";
import Stripe from "stripe";
import { Locals } from "../../models/general.js";
import { Location } from "../../models/restaurant.js";
import { stripe } from "../../setup/stripe.js";
import { logged } from "../../middleware/auth.js";
import { restaurantWorker } from "../../middleware/restaurant.js";
import { updateRestaurant } from "../../utils/data/restaurant.js";
import { updateUser } from "../../utils/data/users.js";



const router = Router({ mergeParams: true });




router.put("/general", logged(), restaurantWorker({ info: { name: 1, description: 1 } }, { settings: { info: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { name, description } = req.body;

    console.log(req.body);

    if(!name || !description || typeof name != "string" || typeof description != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }


    const update = await updateRestaurant({ _id: restaurant._id, }, { $set: { "info.description": description, "info.name": name } }, { projection: { _id: 1 } });


    res.send({ updated: update.ok == 1 });
});

router.get("/general", logged(), restaurantWorker({ info: { name: 1, description: 1, } }, { settings: { info: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;


    res.send({
        name: restaurant.info.name,
        description: restaurant.info.description,
    });
});

interface LocationPayments {
    id: string;
    name: string;
    card: boolean;
    cash: boolean;
}
router.get("/payments", logged(), restaurantWorker({ stripe: { stripeAccountId: 1 }, locations: 1 }, { settings: { payments: true } }), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;

    if(!restaurant.stripe?.stripeAccountId) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(!restaurant.locations) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    let account: Stripe.Account = null!;

    try {
        account = await stripe.accounts.retrieve(restaurant.stripe.stripeAccountId!);
    } catch (e) {
        res.sendStatus(500);
    }

    if(!account) {
        return res.status(404).send({ reason: "AccountNotFound" });
    }

    if(!account.requirements) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    const response: any = {
        bankAccount: null,
        address: null,
        dob: false,
        name: false,
        locationsPayments: [],
    }

    for(let l of restaurant.locations) {
        response.locationsPayments.push({
            id: l.id,
            name: l.name,
            cash: l.settings.methods?.cash,
            card: l.settings.methods?.card,
        });
    }


    const isRequired = (p: string) => {
        if(account.requirements!.currently_due?.includes(p)) {
            return true;
        }
        return false;
    }


    if(!isRequired("external_account")) {
        if(account.external_accounts?.data[0]) {
            const ea = account.external_accounts?.data[0];
            response.bankAccount = {
                last4: ea.last4,
                currency: ea.currency,
                status: ea.status,
            };
        } else {
            console.error("EXTERNAL ACCOUNT IS NOT REQUIRED BUT IT ALSO DOESN'T EXIST");
        }
    }

    if(
        !isRequired("individual.address.city") &&
        !isRequired("individual.address.line1") &&
        !isRequired("individual.address.postal_code") &&
        !isRequired("individual.address.state") &&
        !isRequired("individual.address.day")
    ) {
        if(account.company?.address) {
            response.address = {
                line1: account.company.address.line1,
                line2: account.company.address.line2,
                city: account.company.address.city,
                state: account.company.address.state,
                postalCode: account.company.address.postal_code,
            };
        }
    } else {
        response.locations = restaurant.locations;
    }

    if(!isRequired("individual.dob.day")) {
        response.dob = true;
    }

    if(!isRequired("individual.first_name")) {
        response.name = true;
    }


    res.send(response);
});
router.post("/payments/address", logged(), restaurantWorker({ stripe: { stripeAccountId: 1, }, locations: 1 }, { settings: { payments: true } }), async (req, res) => {
    const { location: locationId } = req.body;
    const { restaurant, } = res.locals as Locals;

    if(!locationId || typeof locationId != "string" || locationId.length != 24) {
        return res.status(422).send({ reason: "InvalidLocationId" });
    }

    if(!restaurant.stripe || !restaurant.stripe.stripeAccountId) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    
    if(!restaurant.locations || restaurant.locations.length == 0) {
        return res.status(404).send({ reason: "LocationNotFound" });
    }

    let location: Location = null!;

    for(let l of restaurant.locations) {
        if(l._id.equals(locationId)) {
            location = l;
            break;
        }
    }


    if(!location) {
        return res.status(404).send({ reason: "LocationNotFound" });
    }

    try {
        const account = await stripe.accounts.update(restaurant.stripe.stripeAccountId, {
            individual: {
                address: {
                    line1: location.line1,
                    line2: location.line2,
                    postal_code: location.postalCode,
                    city: location.city,
                    state: location.state,
                    country: location.country,
                }
            }
        });

    } catch (e) {
        res.status(500).send({ reason: "InvalidError" });
        return;
    }

    res.send({ updated: true });


    await updateRestaurant({ _id: restaurant._id, }, { $set: { "locations.$[location].isUsedForStripe": true } }, { arrayFilters: [{ "location._id": location._id }], projection: { _id: 1 } })
});
router.post("/payments/dob", logged(), restaurantWorker({ stripe: { stripeAccountId: 1, } }, { settings: { payments: true } }), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;
    const { dob } = req.body;

    if(!restaurant.stripe || !restaurant.stripe.stripeAccountId) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(!dob) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(!dob.month || !dob.year || !dob.date || typeof dob.month != "number" || typeof dob.date != "number" || typeof dob.year != "number") {
        return res.status(422).send({ reason: "InvalidInput" });
    }


    if(dob.month < 1 || dob.month > 12 || dob.year < 1900 || dob.year > 2022 || dob.date < 1 || dob.date > 31) {
        return res.status(422).send({ reason: "InvalidDate" });
    }



    try {
        const account = await stripe.accounts.update(restaurant.stripe.stripeAccountId, {
            individual: {
                dob: {
                    day: dob.date,
                    year: dob.year,
                    month: dob.month,
                }
            }
        });
    } catch (e) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    console.log(dob);

    res.send({ updated: true });


    updateUser({ _id: user._id }, { $set: { "info.dob": dob } }, { projection: { _id: 1 } });
});
router.post("/payments/name", logged(), restaurantWorker({ stripe: { stripeAccountId: 1 } }, { settings: { payments: true } }), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;
    const { name } = req.body;

    if(!restaurant.stripe || !restaurant.stripe.stripeAccountId) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(!name || !name.firstName || !name.lastName) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(typeof name.firstName != "string" || typeof name.lastName != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    try {
        const account = await stripe.accounts.update(restaurant.stripe?.stripeAccountId, {
            individual: {
                first_name: name.firstName,
                last_name: name.lastName,
            }
        });
    } catch (e) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    res.send({ updated: true });
});
router.post("/payments/bank-account", logged(), restaurantWorker({ stripe: { stripeAccountId: 1 } }, { settings: { payments: true } }), async (req, res) => {
    const { branch, number, institution, name } = req.body;
    const { restaurant } = res.locals as Locals;


    if(!restaurant.stripe || !restaurant.stripe.stripeAccountId) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(!branch || !number || !institution || !name) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(typeof branch != "string" || branch.length != 5 || typeof number != "string" || number.length < 5 || number.length > 12 || typeof institution != "string" || institution.length != 3 || typeof name != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    let bankAccount: any;

    try {
        const token = await stripe.tokens.create({
            bank_account: {
                account_holder_name: name,
                account_number: number,
                routing_number: `${branch}-${institution}`,
                country: "CA",
                currency: "CAD"
            }
        });

        const account = await stripe.accounts.createExternalAccount(restaurant.stripe.stripeAccountId, { external_account: token.id });

        bankAccount = {
            last4: account.last4,
            status: account.status,
            currency: account.currency,
        }
    } catch (e) {
        console.log(e);
        return res.status(500).send({ reason: "InvalidError" });
    }


    res.send({ updated: true, bankAccount });

});



export {
    router as SettingsRouter,
}