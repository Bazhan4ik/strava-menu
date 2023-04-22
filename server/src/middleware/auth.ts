import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { id } from "../utils/other/id.js";
import { getUser } from "../utils/data/users.js";



function createJWT(data: { expires: number; userId: string; }) {
    return jwt.sign(data, "CREATE JWT KEY AND ADD HERE");
}




function logged(projection: any = { _id: 1, }) {
    return (req: Request, res: Response, next: NextFunction) => {

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
                return res.status(401).send({
                    reason: "Unauthorized"
                });
            }

            req.user = user;

            projection.status = 1;

            const u = await getUser({ _id: id(req.user! as string) }, { projection });

            
            if(!u) {
                return res.status(404).send({
                    reason: "AccountNotFound",
                });
            }

            if(u.status == "restricted" && req.path != "/email-verification") {
                return res.status(403).send({ reason: "RestrictedAccount" });
            }
            
            res.locals.user = u;

            next();
        })(req, res, next);

    }

}



export {
    createJWT,
    logged,
}