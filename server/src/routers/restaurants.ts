import { Router } from "express";
import { Locals } from "../models/general.js";
import { WorkerSettings } from "../models/worker.js";
import { logged } from "../utils/middleware/auth.js";
import { restaurantWorker } from "../utils/middleware/restaurant.js";
import { AnalyticsRouter } from "./restaurants/analytics.js";
import { CustomersRouter } from "./restaurants/customers.js";
import { IngredientsRouter } from "./restaurants/ingredients.js";
import { LayoutRouter } from "./restaurants/layout.js";
import { LocationsRouter } from "./restaurants/locations.js";
import { MenuRouter } from "./restaurants/menu/menu.js";
import { OrdersRouter } from "./restaurants/orders.js";
import { SettingsRouter } from "./restaurants/settings.js";
import { StaffRouter } from "./restaurants/staff.js";
import { TablesRouter } from "./restaurants/tables.js";



const router = Router({ mergeParams: true });


router.use("/ingredients", IngredientsRouter);
router.use("/analytics", AnalyticsRouter);
router.use("/customers", CustomersRouter);
router.use("/locations", LocationsRouter);
router.use("/settings", SettingsRouter);
router.use("/orders", OrdersRouter);
router.use("/layout", LayoutRouter);
router.use("/tables", TablesRouter);
router.use("/staff", StaffRouter);
router.use("/menu", MenuRouter);


router.get("/", logged(), restaurantWorker({ info: { name: 1, id: 1, }, staff: { settings: 1, userId: 1, } }, { work: { manager: true } }), async (req, res) => {
    const { user, restaurant } = res.locals as Locals;

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

    const pages: {
        menu: boolean;
        settings: boolean;
        analytics: boolean;
        customers: boolean;
        locations: boolean;
        orders: boolean;
        staff: boolean;
        tables: boolean;
        layout: boolean;
    } = {
        menu: settings.dishes?.available! || settings.isOwner!,
        settings: settings.settings?.available! || settings.isOwner!,
        analytics: settings.isOwner!,
        customers: settings.customers?.available! || settings.isOwner!,
        locations: settings.locations?.available! || settings.isOwner!,
        orders: settings.customers?.available! || settings.isOwner!,
        staff: settings.staff?.available! || settings.isOwner!,
        tables: settings.customers?.available || settings.isOwner!,
        layout: settings.customers?.available! || settings.isOwner!,
    }

    res.send({
        name: restaurant.info.name,
        id: restaurant.info.id,
        pages,
    });
});








export {
    router as RestaurantsRouter,
}