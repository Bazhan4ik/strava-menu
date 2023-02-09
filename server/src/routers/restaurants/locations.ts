import { Router } from "express";
import { Locals } from "../../models/general.js";
import { id } from "../../utils/id.js";
import { logged } from "../../utils/middleware/auth.js";
import { restaurantWorker } from "../../utils/middleware/restaurant.js";
import { updateRestaurant } from "../../utils/restaurant.js";



const router = Router({ mergeParams: true });



router.post("/", logged(), restaurantWorker({}, { locations: { adding: true } }), async (req, res) => {
    const { city, state, addressLine1, addressLine2, postalCode, latlng, name } = req.body;
    const { restaurant } = res.locals as Locals;

    if(!city || !state || !addressLine1 || !postalCode || !name) {
        return res.status(400).send({ reason: "InvalidInput" });
    }
    if(typeof city != "string" || typeof state != "string" || typeof name != "string" || typeof addressLine1 != "string" || typeof postalCode != "string" || (addressLine2 && typeof addressLine2 != "string")) {
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
        locations: {
            city: city,
            country: "CA",
            postalCode: postalCode,
            line1: addressLine1,
            line2: addressLine2,
            state: state,
            latlng: latlngParsed!,


            name: name,
            _id: id(),
            id: name.replace(/[^\w\s]/gi, "").replace(/\s/g, "-").toLowerCase(),
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


export {
    router as LocationsRouter,
}