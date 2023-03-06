import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { ConvertedWaiterRequest } from "../../models/other/waiterRequest.js";
import { WaiterRequest } from "../../models/session.js";
import { convertMultipleSessionsSessionDishes, convertSessionDishes } from "../../utils/convertSessionDishes.js";
import { id } from "../../utils/id.js";
import { logged } from "../../utils/middleware/auth.js";
import { restaurantWorker } from "../../utils/middleware/restaurant.js";
import { addOrder } from "../../utils/orders.js";
import { aggregateSessions, getSession, getSessions, updateSession } from "../../utils/sessions.js";
import { sendToCustomerDishStatus } from "../../utils/socket/customer.js";
import { sendDishIsServed, sendToStaffNewOrder } from "../../utils/socket/dishes.js";
import { sendToCustomerAcceptWaiterRequest, sendToCustomerQuitWaiterRequest, sendToCustomerResolveWaiterRequest, sendToWaiterAcceptWaiterRequest, sendToWaiterCancelWaiterRequest, sendToWaiterQuitWaiterRequest, sendToWaiterResolveWaiterRequest } from "../../utils/socket/waiterRequest.js";
import { getDelay } from "../../utils/time.js";
import { getUser } from "../../utils/users.js";




const router = Router({ mergeParams: true });


interface WaiterRequestModified extends WaiterRequest {
    sessionId: string;
    customerId: ObjectId;
    total: number;
    id: string;
    type: string;
}
router.get("/requests", logged(), restaurantWorker({}, { work: { waiter: true } }), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;

    const requests: WaiterRequestModified[] = await aggregateSessions(restaurant._id, [
        { $unwind: "$waiterRequests" },
        { $match: { "waiterRequests.active": true } },
        { $sort: { "waiterRequests.requestedTime": 1 } },
        {
            $project: {
                "_id": "$waiterRequests._id",
                "sessionId": "$_id",
                "requestedTime": "$waiterRequests.requestedTime",
                "acceptedTime": "$waiterRequests.acceptedTime",
                "waiterId": "$waiterRequests.waiterId",
                "reason": "$waiterRequests.reason",
                "customerId": "$customer.customerId",
                "total": "$payment.money.total",
                "amount": "$waiterRequests.amount",
                "id": "$info.id",
                "type": "$info.type",
            }
        }
    ]).toArray() as WaiterRequestModified[];

    if (!requests) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    if (requests.length == 0) {
        return res.send([]);
    }

    const result: ConvertedWaiterRequest[] = [];

    for (let request of requests) {
        const getAccount = async (id?: ObjectId) => {
            if (!id) {
                return null!;
            }

            const user = await getUser({ _id: id }, { projection: { info: { name: 1 }, avatar: 1 } });

            if (!user) {
                return null!;
            }

            return {
                name: `${user.info?.name?.first} ${user.info?.name?.last}`,
                avatar: user.avatar?.buffer,
            };
        }

        let reasonTitle: string;
        let acceptedTitle: string = "Accepted";
        let resolveButtonText: string = "Resolved";
        switch (request.reason) {
            case "payment":
                reasonTitle = "Help with payment problems";
                break;
            case "cash":
                resolveButtonText = `Collected $${request.total / 100}`;
                acceptedTitle = `Customer has to pay $${request.total / 100}`;
                reasonTitle = "Collect cash & confirm order";
                break;
            case "refund":
                acceptedTitle = `Refund $${request.amount ? request.amount / 100 : null! }`;
                reasonTitle = "Refund a dish";
                break;
            case "other":
                reasonTitle = "Other inquiry";
                break;
        }

        const r: ConvertedWaiterRequest = {
            waiter: await getAccount(request.waiterId)!,
            customer: await getAccount(request.customerId),
            reason: request.reason,
            acceptedTime: getDelay(request.acceptedTime),
            requestedTime: getDelay(request.requestedTime),
            _id: request._id,
            sessionId: request.sessionId,
            self: request.waiterId?.equals(user._id)!,
            total: request.total,
            sessionIdNumber: request.id,
            sessionType: request.type,

            ui: {
                reasonTitle: reasonTitle!,
                acceptButtonText: "Accept",
                cancelButtonText: "Cancel",
                idTitle: "#" + request.id,
                typeTitle: request.type == "dinein" ? "Table" : "Order",
                resolveButtonText: resolveButtonText,
                acceptedTitle: request.acceptedTime ? acceptedTitle! : null!,
            }
        };

        result.push(r);
    }



    console.log(result);


    res.send(result);
});


router.put("/requests/accept", logged({ avatar: 1, info: { name: 1 } }), restaurantWorker({}, { work: { waiter: true } }), async (req, res) => {
    const { sessionId, requestId } = req.body;
    const { restaurant, user, location } = res.locals as Locals;


    const session = await getSession(restaurant._id, { _id: id(sessionId) }, { projection: { payment: { money: { total: 1 } }, waiterRequests: { _id: 1, active: 1, waiterId: 1, reason: 1, amount: 1, }, customer: { socketId: 1 } } });

    if (!session) {
        return res.status(404).send({ reason: "SessionNotFound" });
    }

    if (!session.waiterRequests || session.waiterRequests.length == 0) {
        return res.status(400).send({ reason: "NoWaiterRequests" });
    }

    let request: WaiterRequest = null!;

    for (let r of session.waiterRequests) {
        if (r._id.equals(requestId)) {
            if (!r.active || r.waiterId) {
                return res.status(403).send({ reason: "WaiterRequestTaken" });
            }
            request = r;
        }
    }

    if (!request) {
        return res.status(404).send({ reason: "WaiterRequestNotFound" });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId) },
        {
            $set: {
                "waiterRequests.$[request].waiterId": user._id,
                "waiterRequests.$[request].acceptedTime": Date.now(),
            }
        },
        { arrayFilters: [{ "request._id": id(requestId) }], projection: { _id: 1 } }
    );



    const waiter = { name: `${user.info?.name?.first} ${user.info?.name?.last}`, avatar: user.avatar?.buffer };
    const delay = { hours: 0, minutes: 0, nextMinute: 59500 };


    let acceptedTitle: string = "Request accepted";
    switch (request.reason) {
        case "cash":
            acceptedTitle = `Customer has to pay $${session.payment?.money?.total! / 100}`;
            break;
        case "refund":
            acceptedTitle = `Refund $${request.amount ? request.amount / 100 : null!}`;
            break;
    }

    res.send({
        updated: update.ok == 1,
        waiter,
        delay,
        acceptedTitle: acceptedTitle,
    });

    sendToCustomerAcceptWaiterRequest(session.customer.socketId, { waiter, time: delay, requestId: requestId });
    sendToWaiterAcceptWaiterRequest(restaurant._id, location, { user: waiter, time: { hours: 0, minutes: 0, nextMinute: 59600 }, sessionId: session._id, requestId: requestId });
});
router.put("/requests/quit", logged({ avatar: 1, info: { name: 1 } }), restaurantWorker({}, { work: { waiter: true } }), async (req, res) => {
    const { user, restaurant, location } = res.locals as Locals;
    const { sessionId, requestId } = req.body;

    const session = await getSession(
        restaurant._id,
        { _id: id(sessionId) },
        { projection: { waiterRequests: { active: true, _id: 1, waiterId: 1 }, customer: { socketId: 1, } } }
    );

    if (!session) {
        return res.status(400).send({ reason: "SessionNotFound" });
    }

    if (!session.waiterRequests || session.waiterRequests.length == 0) {
        return res.status(400).send({ reason: "NoWaiterRequests" });
    }

    let request: WaiterRequest = null!;

    for (let r of session.waiterRequests) {
        if (r._id.equals(requestId)) {
            if (!r.waiterId?.equals(user._id)) {
                return res.status(403).send({ reason: "Wrong" });
            }

            request = r;
        }
    }

    if (!request) {
        return res.status(404).send({ reason: "NoRequestFound" });
    }


    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId) },
        {
            $set: {
                "waiterRequests.$[request].waiterId": null,
                "waiterRequests.$[request].acceptedTime": null,
            },
            $push: {
                "waiterRequests.$[request].waiters": { canceledTime: Date.now(), waiterId: user._id },
            }
        },
        { arrayFilters: [{ "request._id": id(requestId) }], projection: { _id: 1 } }
    );


    res.send({
        updated: update.ok == 1,
    });

    sendToCustomerQuitWaiterRequest(session.customer.socketId, { requestId: request._id });
    sendToWaiterQuitWaiterRequest(restaurant._id, location, { requestId: request._id, sessionId: session._id });
});
router.put("/requests/resolve", logged({ avatar: 1, info: { name: 1 } }), restaurantWorker({ customers: { userId: 1, } }, { work: { waiter: true } }), async (req, res) => {
    const { user, restaurant, location } = res.locals as Locals;
    const { sessionId, requestId } = req.body;

    const session = await getSession(
        restaurant._id,
        { _id: id(sessionId) },
        {
            projection: {
                customer: { socketId: 1, customerId: 1, },
                dishes: 1,
                info: { comment: 1 },
                waiterRequests: {
                    active: true,
                    waiterId: 1,
                    reason: 1,
                    _id: 1,
                }
            }
        }
    );

    if (!session) {
        return res.status(400).send({ reason: "SessionNotFound" });
    }

    if (!session.waiterRequests || session.waiterRequests.length == 0) {
        return res.status(400).send({ reason: "NoWaiterRequests" });
    }


    let request: WaiterRequest = null!;

    for (let r of session.waiterRequests) {
        if (r._id.equals(requestId)) {
            if (!r.waiterId?.equals(user._id)) {
                return res.status(403).send({ reason: "Wrong" });
            }
            request = r;
        }
    }

    if (!request) {

        let resolvedAmount = 0;
        for(let request of session.waiterRequests) {
            if(request.active) {
                resolvedAmount++;
            }
        }
        if(resolvedAmount == session.waiterRequests.length) {
            addOrder(restaurant, session._id);
        }

        return res.status(404).send({ reason: "NoRequestFound" });
    }

    const updateFilter: any = {
        $set: {
            "waiterRequests.$[request].resolvedTime": Date.now(),
            "waiterRequests.$[request].active": false,
            "payment.method": "cash",
            "timing.ordered": Date.now(),
        },
    };

    if (request.reason == "cash") {
        updateFilter["$set"]["status"] = "progress";

        const convertedOrderDishes = await convertSessionDishes({
            restaurantId: restaurant._id,
            sessionId: session._id,
            ordered: getDelay(Date.now()),
            sessionDishes: session.dishes,
            skip: [],
            customerId: session.customer.customerId!,
            comment: session.info.comment,
        });

        sendToStaffNewOrder(restaurant._id, location, convertedOrderDishes);
    }


    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId) },
        updateFilter,
        { arrayFilters: [{ "request._id": id(requestId) }], projection: { _id: 1, dishes: { status: 1, }, waiterRequests: { active: 1 } } }
    );

    if(update.session) {
        let resolvedAmount = 0;

        for (let r of update.session.waiterRequests) {
            if(!r.active) {
                resolvedAmount++;
            }
        }
        for(let d of update.session.dishes) {
            if(d.status != "served" && d.status != "removed") {
                resolvedAmount--; // not done dishes are still remaining in order. -- so the order status is not updated to "done"
                break;
            }
        }
    
        if(update.session.waiterRequests.length == resolvedAmount) {
            addOrder(restaurant, session._id);
        }

    }


    res.send({
        updated: update.ok == 1,
    });

    sendToCustomerResolveWaiterRequest(session.customer.socketId, { requestId: request._id });
    sendToWaiterResolveWaiterRequest(restaurant._id, location, { sessionId: session._id, requestId: request._id });
});

router.get("/dishes", logged(), restaurantWorker({}, { work: { waiter: true } }), async (req, res) => {
    const { restaurant, user, location } = res.locals as Locals;


    const sessions = await getSessions(restaurant._id, { status: "progress", "info.location": location }, { projection: { dishes: 1, customer: 1, info: 1, timing: 1, } }).toArray();

    if (!sessions) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const convertedOrderDishes = await convertMultipleSessionsSessionDishes({
        restaurantId: restaurant._id,
        sessions,
        skipStatuses: ["ordered", "served", "removed", "cooking"]
    });

    res.send(convertedOrderDishes);
});

router.get("/session/:sessionId", logged(), restaurantWorker({}, { work: { waiter: true } }), async (req, res) => {
    const { sessionId } = req.params;
    const { restaurant, location } = res.locals as Locals;

    if (!sessionId) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    const session = await getSession(
        restaurant._id,
        { _id: id(sessionId) },
        { projection: { info: 1, } },
    );


    if (!session) {
        return res.status(404).send({ reason: "SessionNotFound" });
    }

    console.log(session);

    res.send({
        ...session.info
    });

});


router.put("/served", logged(), restaurantWorker({ customers: 1, }, { work: { waiter: true } }), async (req, res) => {
    const { sessionId, sessionDishId } = req.body;
    const { restaurant, user, location } = res.locals as Locals;

    if (!sessionId) {
        return res.status(400).send({ reason: "SessionIdNotProvided" });
    }
    if (!sessionDishId) {
        return res.status(400).send({ reason: "SessionDishIdNotProvided" });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId) },
        {
            $set: {
                "dishes.$[sessionDish].status": "served",
                "dishes.$[sessionDish].timing.served": Date.now(),
                "dishes.$[sessionDish].staff.waiter": user._id

            }
        },
        {
            arrayFilters: [{ "sessionDish._id": id(sessionDishId) }],
            projection: {
                customer: { socketId: 1, customerId: 1, },
                timing: { ordered: 1, },
                waiterRequests: { active: 1 },
                dishes: { _id: 1, status: 1 }
            }
        }
    );

    if (update.ok != 1) {
        return res.send({ updated: false });
    }

    if (!update.session) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    let amountOfDishesServed = 0;
    for (let dish of update.session.dishes) {
        if (dish.status == "served" || dish.status == "removed") {
            amountOfDishesServed++;
        }
        if (dish._id.equals(sessionDishId)) {
            if (dish.status != "served") {
                return res.send({ updated: false });
            }
        }
    }
    for(let request of update.session.waiterRequests) {
        if(request.active) {
            amountOfDishesServed--;
            break;
        }
    }

    if (update.session.dishes.length == amountOfDishesServed) {
        const sessionDone = await addOrder(restaurant, update.session._id);
    }



    res.send({ updated: true });

    sendDishIsServed(restaurant._id, location, { sessionId: update.session._id, sessionDishId: id(sessionDishId) });
    sendToCustomerDishStatus(restaurant._id, update.session?.customer.socketId!, { sessionDishId: id(sessionDishId), status: "served" });
});



export {
    router as WaiterRouter,
}