import { Router } from "express";
import { Locals } from "../../models/general.js";
import { id } from "../../utils/other/id.js";
import { customerSession } from "../../middleware/customerSession.js";
import { customerRestaurant } from "../../middleware/customerRestaurant.js";
import { createSession, updateSession, updateSessions } from "../../utils/data/sessions.js";
import { joinCustomer } from "../../utils/socket/socket.js";
import { convertTime } from "../../utils/other/time.js";
import { getUser } from "../../utils/data/users.js";
import { ItemRouter } from "./item.js";
import { TipRouter } from "./tip.js";
import { OrderRouter } from "./order.js";
import { RequestOrder } from "./request.js";
import { CheckoutRouter } from "./checkout.js";
import { DeliveryRouter } from "./delivery.js";


const router = Router({ mergeParams: true });


router.use("/item", ItemRouter);
router.use("/tip", TipRouter);
router.use("/order", OrderRouter);
router.use("/request", RequestOrder);
router.use("/checkout", CheckoutRouter);
router.use("/delivery", DeliveryRouter);





router.get("/",
    customerRestaurant({ info: { name: 1, id: 1 }, tables: 1, locations: { _id: 1, id: 1, settings: { customers: 1, } } }),
    customerSession({
        info: 1,
        waiterRequests: 1,
        customer: { generatedId: 1, },
        items: {
            _id: 1,
            itemId: 1,
            info: 1
        },
    }, {}, false),
    async (req, res) => {
        const { restaurant, session, user } = res.locals as Locals;
        let { socketId, table: tableId, location: locationId } = req.query;

        if (!restaurant.tables) {
            return res.status(500).send({ reason: "InvalidError" });
        }

        if (!restaurant.locations || restaurant.locations.length == 0) {
            return res.status(500).send({ reason: "InvalidError" });
        }

        if (!locationId || typeof locationId != "string") {
            return res.status(400).send({ reason: "LocationNotProvided" });
        }

        const getLocation = () => {

            for (let l of restaurant.locations!) {
                if (l.id == locationId) {
                    return l;
                }
            }

            return null;
        }
        const getTable = () => {
            if (!tableId || typeof tableId != "string") {
                return null!;
            }
            if (!restaurant.tables![locationId as string]) {
                return null;
            }
            for (let t of restaurant.tables![locationId as string]) {
                if (t._id.equals(tableId as string)) {
                    return t.id;
                }
            }
            return null!;
        }

        const location = getLocation();
        const table = getTable();

        if (!location) {
            return res.status(400).send({ reason: "InvalidLocation" });
        }

        if (typeof socketId != "string") {
            socketId = undefined;
        } else {
            joinCustomer(socketId as string, restaurant._id, location._id);
        }




        const response: any = {
            restaurant: {
                name: restaurant?.info.name,
                id: restaurant?.info.id,
                _id: restaurant._id,
            },
            showTracking: !!user,
        }


        if (!session) { // CREATE SESSION

            const newSessionId = id();
            const newGeneratedId = id(); // send as cookie to keep track of the user's session

            const newSession = await createSession(restaurant._id, {
                _id: newSessionId,
                customer: {
                    by: "customer",
                    customerId: user?._id || null!,
                    socketId: socketId || null!,
                    generatedId: !user ? newGeneratedId : undefined,
                },
                timing: {
                    connected: Date.now(),
                },
                timeline: [
                    {
                        action: "created",
                        userId: "customer",
                        time: Date.now(),
                    }
                ],
                info: {
                    id: location.settings.customers?.allowDineIn ? table?.toString()! : Math.floor(Math.random() * 9000 + 1000).toString(),
                    type: location.settings.customers?.allowDineIn || table ? "dinein" : "takeout",
                    location: location._id,
                },
                status: "ordering",
                items: [],
                waiterRequests: [],
            });

            response.session = {
                items: [],
                id: table?.toString()!,
                type: location.settings.customers?.allowDineIn ? "dinein" : "takeout",
            };

            response.setSessionId = newGeneratedId;
        } else {

            const getWaiterRequest = async () => {
                if (!session.waiterRequests) {
                    return null!;
                }
                for (let request of session.waiterRequests) {
                    if (request.active) {

                        let waiter: any = null!;

                        if (request.waiterId) {
                            const user = await getUser({ _id: request.waiterId }, { projection: { info: { name: 1, }, avatar: 1, } });

                            if (!user) {
                                console.error("at session.ts getWaiterRequest()");
                                throw "no waiter account";
                            };

                            waiter = {
                                name: `${user?.info?.name?.first} ${user?.info?.name?.last}`,
                                avatar: user.avatar?.buffer,
                            };
                        }

                        return {
                            _id: request._id,
                            reason: request.reason,
                            active: request.active,
                            accepted: convertTime(request.acceptedTime),
                            waiter: waiter,
                        }
                    }
                }
            }

            response.session = {
                info: session.info,
                items: session.items.map(d => { return { itemId: d.itemId, _id: d._id, comment: d.info.comment } }),
                waiterRequest: await getWaiterRequest(),
            }

            const $set: any = {
                "customer.socketId": socketId,
                "info.location": location._id,
                "timing.connected": Date.now(),
            };

            if (table) {
                $set["info.id"] = location.settings.customers?.allowDineIn ? table?.toString()! : Math.floor(Math.random() * 9000 + 1000).toString();
            }

            if(!user && session.customer.generatedId) {
                response.setSessionId = session.customer.generatedId;
            }

            updateSession(
                restaurant._id,
                { _id: session._id },
                { $set },
                { noResponse: true },
            );
        }

        res.send(response);


        if (user) {
            updateSessions(restaurant._id, { $or: [{ _id: session?._id }, { "customer.customerId": user._id }], }, { $set: { "customer.socketId": socketId } }, { noResponse: true });
        }
    });

// router.post("/socketId", customerRestaurant({ info: { name: 1, id: 1 } }), customerSession({ info: { location: 1, } }, {}, false), async (req, res) => {
//     const { restaurant, session } = res.locals as Locals;
//     const { socketId } = req.body;

//     if (!socketId) {
//         return res.status(400).send({ reason: "SocketIdNotProvided" });
//     }

//     if (typeof socketId != "string") {
//         return res.status(422).send({ reason: "InvalidInput" });
//     }

//     joinCustomer(socketId, restaurant._id, session.info.location);

//     res.send({ updated: true });
// });





export {
    router as SessionRouter
}