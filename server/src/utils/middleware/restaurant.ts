import { NextFunction, Request, Response } from "express";
import { Locals } from "../../models/general.js";
import { WorkerSettings } from "../../models/worker.js";
import { compareWorkerSettings, getRestaurant } from "../restaurant.js";

function restaurantWorker(projection: any = {}, ...settings: WorkerSettings[]) {
    return async (req: Request, res: Response, next: NextFunction) => {

        const { user } = res.locals as Locals;

        const { restaurantId, locationId } = req.params;

        if(projection) {
            if(!projection.staff) {
                projection.staff = {};
            }

            if(projection.staff != 1) {
                projection.staff.settings = 1;
                projection.staff.userId = 1;
            }

            if(locationId && projection.locations != 1) {
                projection.locations = { id: 1, _id: 1 };
            }
        }

        const restaurant = await getRestaurant({ "info.id": restaurantId }, { projection: projection, });



        if(!restaurant || !restaurant.staff) {
            return res.status(404).send({ reason: "RestaurantNotFound" });
        }

        for(let worker of restaurant.staff) {
            if(worker.userId.equals(user._id)) {

                let locationPassed = true;

                if(locationId && restaurant.locations) {
                    locationPassed = false;
                    for(let location of restaurant.locations) {
                        if(location.id == locationId) {
                            locationPassed = true;
                            res.locals.location = location._id;
                            break;
                        }
                    }
                }

                const passed = compareWorkerSettings(worker.settings, settings);

                if(passed && locationPassed) {

                    res.locals.restaurant = restaurant;

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