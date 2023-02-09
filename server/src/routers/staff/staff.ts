import { Router } from "express";
import { Locals } from "../../models/general.js";
import { WorkerSettings } from "../../models/worker.js";
import { logged } from "../../utils/middleware/auth.js";
import { restaurantWorker } from "../../utils/middleware/restaurant.js";
import { joinStaff } from "../../utils/socket/socket.js";
import { CookRouter } from "./cook.js";
import { WaiterRouter } from "./waiter.js";




const router = Router({ mergeParams: true });


router.use("/:locationId/waiter", WaiterRouter);
router.use("/:locationId/cook", CookRouter);



router.get("/", logged(), restaurantWorker({ _id: 1, locations: 1, staff: { userId: 1, settings: { work: 1, } }, info: { name: 1, id: 1 }, }, { work: { cook: true }, }, { work: { waiter: true } }), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;

    if(!restaurant.staff) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getWorkerSettings = () => {
        for(let w of restaurant.staff!) {
            if(w.userId.equals(user._id)) {
                return w.settings;
            }
        }

        return null;
    }

    let settings: WorkerSettings = getWorkerSettings()!;

    if(!settings) {
        return res.status(400).send({ reason: "NotWorker" });
    }



    res.send({
        locations: restaurant.locations,
        restaurant: {
            name: restaurant.info.name,
            id: restaurant.info.id,
            pages: {
                waiter: settings.work?.waiter || settings.isOwner!,
                cook: settings.work?.cook || settings.isOwner!,
                requests: settings.work?.waiter || settings.isOwner!,
            }
        },
    });
});



router.post("/:locationId", logged(), restaurantWorker({ }, { work: { cook: true }, }, { work: { waiter: true } }), async (req, res) => {
    const { socketId } = req.body;
    const { restaurant, location } = res.locals as Locals;

    if(socketId && typeof socketId == "string") {
        joinStaff(socketId, restaurant._id, location);
    }

    res.send({});
});





export {
    router as StaffRouter,
}