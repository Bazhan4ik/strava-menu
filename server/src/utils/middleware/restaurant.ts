import { NextFunction, Request, Response } from "express";
import { Locals } from "../../models/general.js";
import { WorkerSettings } from "../../models/worker.js";
import { compareWorkerSettings, getRestaurant } from "../restaurant.js";

function restaurantWorker(projection: any = {}, ...settings: WorkerSettings[]) {
    return async (req: Request, res: Response, next: NextFunction) => {

        const { user } = res.locals as Locals;

        const { restaurantId } = req.params;

        if(projection) {
            if(!projection.staff) {
                projection.staff = {};
            }

            projection.staff.settings = 1;
            projection.staff.userId = 1;
        }

        const result = await getRestaurant({ "info.id": restaurantId }, { projection: projection, });


        if(!result || !result.staff) {
            return res.status(404).send({ reason: "RestaurantNotFound" });
        }

        for(let worker of result.staff) {
            if(worker.userId.equals(user._id)) {
                const allowed = compareWorkerSettings(worker.settings, settings);

                if(allowed) {

                    res.locals.restaurant = result;

                    return next();
                }

                break;
            }
        }


        return res.status(403).send({ reason: "Forbidden" });

    }
}



export {
    restaurantWorker,
}