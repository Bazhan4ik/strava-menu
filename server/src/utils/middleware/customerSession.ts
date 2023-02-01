import { NextFunction, Request, Response } from "express";
import passport from "passport";
import { id } from "../id.js";
import { getUser } from "../users.js";
import { getSession } from "./../sessions.js";



function customerSession(sessionProjection: any = { _id: 1 }, userProjection: any, strict: boolean = true) {
    return (req: Request, res: Response, next: NextFunction) => {

        if(!res.locals.restaurant) {
            throw "No restaurant provided in customerSession() middleware";
        }

        passport.authenticate('jwt', { session: false }, async (err, user, info) => {

            if (err) {
                if(err == "expired") {
                    return res.status(401).send({
                        reason: "SessionExpired"
                    });
                }
                return res.status(403).send({
                    reason: "TokenInvalid",
                });
            }
            if (!user) {

                const sessionId = req.headers["user-session-id"];

                console.error(sessionId);

                if(!sessionId || typeof sessionId != "string") {
                    if(strict) {
                        return res.status(401).send({
                            reason: "Unauthorized"
                        });
                    }

                    return next();
                }

                
                const session = await getSession(res.locals.restaurant._id, { _id: id(sessionId), status: { $ne: "progress" } }, { projection: sessionProjection });

                console.log(session);
                
                if(!session && strict) {
                    return res.status(404).send({
                        reason: "SessionNotFound"
                    });
                }


                res.locals.session = session;

                return next();
            }

            console.log("");

            req.user = user;

            userProjection.status = 1;

            const u = await getUser({ _id: id(req.user! as string) }, { projection: userProjection });

            
            if(!u) {
                return res.status(404).send({
                    reason: "AccountNotFound",
                });
            }
            
            
            if(u.status == "restricted" && req.path != "/email-verification") {
                return res.status(403).send({ reason: "RestrictedAccount" });
            }
            
            const session = await getSession(res.locals.restaurant._id, { "customer.customerId": u._id, status: { $ne: "progress" } }, { projection: sessionProjection });

            if(!session && strict) {
                return res.status(404).send({
                    reason: "SessionNotFound",
                });
            }

            res.locals.session = session;
            res.locals.user = u;

            return next();
        })(req, res, next);

    }
}


export {
    customerSession,
}