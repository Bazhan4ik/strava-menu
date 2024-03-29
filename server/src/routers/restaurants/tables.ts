import { Router } from "express";
import { Locals } from "../../models/general.js";
import { Table } from "../../models/restaurant.js";
import { id } from "../../utils/other/id.js";
import { logged } from "../../middleware/auth.js";
import { restaurantWorker } from "../../middleware/restaurant.js";
import { updateRestaurant } from "../../utils/data/restaurant.js";
import { LiveTablesRouter } from "./tablesLive.js";




const router = Router({ mergeParams: true });


router.use("/live/:locationId", LiveTablesRouter);



router.get("/", logged(), restaurantWorker({ tables: 1, locations: { name: 1, id: 1, } }, { customers: { tables: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;

    if(!restaurant.tables || !restaurant.locations) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getLocationName = (id: string) => {
        for(let l of restaurant.locations!) {
            if(l.id == id) {
                return l.name;
            }
        }
        return null!;
    }


    const result: { locationId: string; locationName: string; tables: any[]; }[] = [];

    for(let locationId of Object.keys(restaurant.tables)) {
        result.push({
            locationId,
            locationName: getLocationName(locationId),
            tables: restaurant.tables[locationId].map(t => { return { ...t } }),
        });
    }


    res.send(result);
});

router.post("/", logged(), restaurantWorker({ tables: 1 }, { customers: { tables: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { locationId } = req.body;

    if(!locationId) {
        return res.status(400).send({ reason: "LocationIdNotProvided" });
    }


    if(!restaurant.tables) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    const table: Table = {
        id: restaurant.tables[locationId].length + 1,
        _id: id(),
    };

    const $push: any = { };
    $push[`tables.${locationId}`] = table;


    const update = await updateRestaurant({ _id: restaurant._id }, { $push }, { projection: { _id: 1 } });
    

    res.send({ updated: update.ok == 1, table: { ...table, orders: 0 } });
});

router.delete("/:locationId", logged(), restaurantWorker({ tables: 1 }, { customers: { tables: true } }), async (req, res) => {
    const { locationId } = req.params;
    const { restaurant } = res.locals as Locals;

    if(!restaurant.tables) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const $pull: any = {};
    $pull[`tables.${locationId}`] = { _id: restaurant.tables[locationId][restaurant.tables[locationId].length - 1]._id };

    const update = await updateRestaurant(
        { _id: restaurant._id },
        { $pull },
        { projection: { _id: 1 } }
    );


    res.send({ updated: update.ok == 1 });
});





export {
    router as TablesRouter,
}