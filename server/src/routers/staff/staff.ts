import { Router } from "express";
import { Locals } from "../../models/general.js";
import { WorkerSettings } from "../../models/worker.js";
import { logged } from "../../middleware/auth.js";
import { restaurantWorker } from "../../middleware/restaurant.js";
import { joinStaff } from "../../utils/socket/socket.js";
import { CookRouter } from "./cook.js";
import { OrderRouter } from "./order.js";
import { WaiterRouter } from "./waiter.js";
import { getItem } from "../../utils/data/items.js";
import { Binary } from "mongodb";
import { id } from "../../utils/other/id.js";




const router = Router({ mergeParams: true });


router.use("/:locationId/waiter", WaiterRouter);
router.use("/:locationId/order", OrderRouter);
router.use("/:locationId/cook", CookRouter);



router.get("/", logged(), restaurantWorker({ _id: 1, locations: { city: 1, line1: 1, id: 1, name: 1, }, staff: { userId: 1, settings: { isOwner: 1, work: 1, } }, info: { name: 1, id: 1 }, }, { work: { cook: true }, }, { work: { waiter: true } }), async (req, res) => {
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
            _id: restaurant._id,
        },
    });
});
router.get("/:locationId/init", logged(), restaurantWorker({ staff: { settings: 1, userId: 1, }, }, { work: { cook: true } }, { work: { waiter: true } }), async (req, res) => {
    const { restaurant, location, user } = res.locals as Locals;
    const { socketId } = req.query;

    if(!socketId || typeof socketId != "string") {
        return res.status(400).send({ reason: "InvalidSocketId" });
    }

    joinStaff(socketId, restaurant._id, location);

    if(!restaurant.staff) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    let settings: WorkerSettings = null!;

    for(let worker of restaurant.staff) {
        if(worker.userId.equals(user._id)) {
            settings = worker.settings;
            break;
        }
    }

    if(!settings) {
        return res.status(403).send({ reason: "NotWorker" });
    }


    res.send({
        redirectTo: (settings.work?.manager || settings.isOwner) ? "dashboard" : "account",
        userId: user._id,
        pages: {
            waiter: settings.work?.waiter || settings.isOwner!,
            cook: settings.work?.cook || settings.isOwner!,
            requests: settings.work?.waiter || settings.isOwner!,
        }
    });
});
router.get("/item/:itemId/image", async (req, res) => {
    const { itemId, restaurantId } = req.params as any;
    const { type } = req.query;

    if(typeof type != "string") {
        return res.status(400).send({ reason: "InvalidType" });
    }
    if(!["preview", "original"].includes(type)) {
        return res.status(400).send({ reason: "InvalidType" });
    }

    const projection: any = { library: {} };
    projection.library[type] = 1;

    const item = await getItem(restaurantId, { _id: id(itemId), }, { projection });


    if(!item) {
        return res.status(404).send({ reason: "NotFound" });
    }

    if(!item.library || !item.library[type as "original"]) {
        return res.status(404).send({ reason: "NotFound" });
    }

    res.contentType("image/png");
    res.setHeader("Content-Length", (item.library[type as "original"] as Binary).buffer.length);
    res.send((item.library[type as "original"] as Binary).buffer);
});




export {
    router as StaffRouter,
}