import { NextFunction, Request, Response } from "express";
import { getRestaurant } from "../utils/data/restaurant.js";



function customerRestaurant(projection: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const { restaurantId } = req.params;

        if(!restaurantId) {
            return res.status(400).send({ reason: "NoRestaurantId" });
        }

        const restaurant = await getRestaurant({ "info.id": restaurantId }, { projection });

        if(!restaurant) {
            return res.status(404).send({ reason: "RestaurantNotFound" });
        }

        res.locals.restaurant = restaurant;

        next();
    }
}


export {
    customerRestaurant
}