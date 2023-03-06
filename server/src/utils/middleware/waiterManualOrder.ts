import { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import passport from "passport";
import { Locals } from "../../models/general.js";
import { Session } from "../../models/session.js";
import { id } from "../id.js";
import { getRestaurant } from "../restaurant.js";
import { getSession, getSessions } from "../sessions.js";
import { getUser } from "../users.js";
import { logged } from "./auth.js";








export function waiterManualOrder(userProjection: any = {}, restaurantProjection: any = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {

        passport.authenticate('jwt', { session: false }, async (err, uid, info) => {
            if (err) {
                if (err == "expired") {
                    return res.status(401).send({
                        reason: "SessionExpired"
                    });
                }
                return res.status(403).send({
                    reason: "TokenInvalid",
                });
            }
            if (!uid) {
                return res.status(401).send({
                    reason: "Unauthorized"
                });
            }

            req.user = uid;

            const { restaurantId, locationId } = req.params;

            if (!restaurantId || !locationId) {
                return res.status(400).send({ reason: "NoRestaurantId" });
            }

            if (!restaurantProjection.staff) {
                restaurantProjection.staff = { settings: 1, userId: 1, locations: 1 };
            } else {
                restaurantProjection.staff.settings = 1;
                restaurantProjection.staff.userId = 1;
                restaurantProjection.staff.locations = 1;
            }
            if (!restaurantProjection.locations) {
                restaurantProjection.locations = { id: 1, _id: 1, locations: 1 };
            } else {
                restaurantProjection.locations._id = 1;
                restaurantProjection.locations.id = 1;
            }

            if(!userProjection.status) {
                userProjection.status = 1;
            }

            const [restaurant, user] = await Promise.all([
                getRestaurant({ "info.id": restaurantId }, { projection: restaurantProjection }),
                getUser({ _id: id(uid as string) }, { projection: userProjection })
            ]);

            if (!user) {
                return res.status(404).send({
                    reason: "AccountNotFound",
                });
            }

            if (user.status == "restricted" && req.path != "/email-verification") {
                return res.status(403).send({ reason: "RestrictedAccount" });
            }

            if (!restaurant) {
                return res.status(404).send({ reason: "RestaurantNotFound" });
            }

            if (!restaurant.staff || !restaurant.locations) {
                return res.status(500).send({ reason: "InvalidError" });
            }

            for (const worker of restaurant.staff) {
                if (worker.userId.equals(req.user as string)) {
                    if ((() => {
                        if(worker.settings.isOwner) {
                            for (const location of restaurant.locations!) {
                                if (location.id == locationId) {
                                    res.locals.location = location._id;
                                    return false;
                                }
                            }
                            return true;
                        }
                        for (const location of restaurant.locations!) {
                            if (location.id == locationId) {
                                for (const l of worker.locations) {
                                    if (l.equals(location._id)) {
                                        res.locals.location = location._id;
                                        return false;
                                    }
                                }
                            }
                        }
                        return true;
                    })()) {
                        return res.status(403).send({ reason: "Location" });
                    }

                    if (!worker.settings.work?.waiter && !worker.settings.isOwner) {
                        return res.sendStatus(403);
                    }
                }
            }

            res.locals.restaurant = restaurant;
            res.locals.user = user;

            next();
        })(req, res, next);
    }
}

interface AnyNumber {
    [key: string]: number | AnyNumber;
}

export function waiterSession(projection: AnyNumber = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const { restaurant, user } = res.locals as Locals;

        if (!restaurant || !user) {
            return res.status(500).send({ reason: "NoLocals" });
        }

        const session = await getSession(
            restaurant._id,
            { "customer.by": "staff", "customer.onBehalf": user._id, status: "ordering", },
            { projection: projection },
        );

        if (!session) {
            return res.status(404).send({ reason: "SessionNotFound" });
        }

        res.locals.session = session;

        next();
    }
}