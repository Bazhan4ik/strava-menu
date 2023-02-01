import { Router } from "express";
import { Locals } from "../models/general.js";
import { logged } from "../utils/middleware/auth.js";
import { restaurantWorker } from "../utils/middleware/restaurant.js";
import { LocationsRouter } from "./restaurants/locations.js";
import { MenuRouter } from "./restaurants/menu/menu.js";
import { SettingsRouter } from "./restaurants/settings.js";



const router = Router({ mergeParams: true });


router.use("/menu", MenuRouter);
router.use("/settings", SettingsRouter);
router.use("/locations", LocationsRouter);


router.get("/", logged(), restaurantWorker({ info: { name: 1, id: 1, } }, { work: { manager: true } }), async (req, res) => {
    const { user, restaurant } = res.locals as Locals;

    res.send({
        name: restaurant.info.name,
        id: restaurant.info.id
    });
});








export {
    router as RestaurantsRouter,
}