import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { ConvertedWaiterRequest } from "../../models/other/waiterRequest.js";
import { WaiterRequest } from "../../models/session.js";
import { convertMultipleSessionsSessionItems, convertSessionItems } from "../../utils/convertSessionItems.js";
import { getItem, getItems } from "../../utils/items.js";
import { id } from "../../utils/id.js";
import { logged } from "../../utils/middleware/auth.js";
import { restaurantWorker } from "../../utils/middleware/restaurant.js";
import { addOrder } from "../../utils/orders.js";
import { aggregateSessions, getSession, getSessions, updateSession } from "../../utils/sessions.js";
import { sendToCustomerItemStatus } from "../../utils/socket/customer.js";
import { sendItemIsServed, sendToStaffNewOrder } from "../../utils/socket/items.js";
import { sendToCustomerAcceptWaiterRequest, sendToCustomerQuitWaiterRequest, sendToCustomerResolveWaiterRequest, sendToWaiterAcceptWaiterRequest, sendToWaiterQuitWaiterRequest, sendToWaiterResolveWaiterRequest } from "../../utils/socket/waiterRequest.js";
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
                reasonTitle = "Refund an item";
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
                items: 1,
                info: { comment: 1, id: 1, type: 1, },
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

        const convertedOrderItems = await convertSessionItems({
            restaurantId: restaurant._id,
            sessionId: session._id,
            ordered: getDelay(Date.now()),
            sessionItems: session.items,
            skip: [],
            customerId: session.customer.customerId!,
            comment: session.info.comment,
            type: session.info.type,
            id: session.info.id,
        });

        sendToStaffNewOrder(restaurant._id, location, convertedOrderItems);
    }


    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId) },
        updateFilter,
        { arrayFilters: [{ "request._id": id(requestId) }], projection: { _id: 1, items: { status: 1, }, waiterRequests: { active: 1 } } }
    );

    if(update.session) {
        let resolvedAmount = 0;

        for (let r of update.session.waiterRequests) {
            if(!r.active) {
                resolvedAmount++;
            }
        }
        for(let d of update.session.items) {
            if(d.status != "served" && d.status != "removed") {
                resolvedAmount--; // not done items are still remaining in order. -- so the order status is not updated to "done"
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

router.get("/items", logged(), restaurantWorker({}, { work: { waiter: true } }), async (req, res) => {
    const { restaurant, user, location } = res.locals as Locals;


    const sessions = await getSessions(restaurant._id, { status: "progress", "info.location": location }, { projection: { items: 1, customer: 1, info: 1, timing: 1, } }).toArray();

    if (!sessions) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const convertedOrderItems = await convertMultipleSessionsSessionItems({
        restaurantId: restaurant._id,
        sessions,
        skipStatuses: ["ordered", "served", "removed", "cooking"]
    });

    res.send(convertedOrderItems);
});

router.get("/session", logged(), restaurantWorker({}, { work: { waiter: true } }), async (req, res) => {
    const { sessionItemId, itemId } = req.query;
    const { restaurant, location } = res.locals as Locals;


    if (typeof itemId != "string" || itemId.length != 24) {
        return res.status(400).send({ reason: "InvalidItemId" });
    }
    if (typeof sessionItemId != "string" || sessionItemId.length != 24) {
        return res.status(400).send({ reason: "InvalidSessionItemId" });
    }

    const session = await getSession(
        restaurant._id,
        { items: { $elemMatch: { _id: id(sessionItemId) } } },
        { projection: { info: { type: 1, id: 1, }, items: { modifiers: 1, _id: 1, } } },
    );


    if(!session) {
        return res.status(404).send({ reason: "SesssionNotFound" });
    }

    const getSelectedModifiers = () => {
        for(const item of session.items) {
            if(item._id.equals(sessionItemId)) {
                return item.modifiers || [];
            }
        }
        return null;
    }

    const modifiers = getSelectedModifiers();

    if(!modifiers) {
        return res.status(400).send({ reason: "ModifiersNotFound" });
    }

    if(modifiers.length == 0) {
        return res.send({ modifiers: [], session: session.info });
    }

    const item = await getItem(
        restaurant._id,
        { _id: id(itemId) },
        { projection: { modifiers: { _id: 1, name: 1, options: { _id: 1, name: 1} } } }
    );

    if(!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }
    if(!item.modifiers) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const result = [];

    for(const itemModifier of modifiers) {
        for(const modifier of item.modifiers) {
            if(itemModifier._id.equals(modifier._id)) {
                const options: string[] = [];

                for(const selected of itemModifier.selected) {
                    for(const option of modifier.options) {
                        if(option._id.equals(selected)) {
                            options.push(option.name);
                        }
                    }
                }

                result.push({
                    name: modifier.name,
                    selected: options,
                });
            }   
        }
    }
    

    res.send({ session: session.info, modifiers: result });

});


router.put("/served", logged(), restaurantWorker({ customers: 1, }, { work: { waiter: true } }), async (req, res) => {
    const { sessionId, sessionItemId } = req.body;
    const { restaurant, user, location } = res.locals as Locals;

    if (!sessionId) {
        return res.status(400).send({ reason: "SessionIdNotProvided" });
    }
    if (!sessionItemId) {
        return res.status(400).send({ reason: "SessionItemIdNotProvided" });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId) },
        {
            $set: {
                "items.$[sessionItem].status": "served",
                "items.$[sessionItem].timing.served": Date.now(),
                "items.$[sessionItem].staff.waiter": user._id

            }
        },
        {
            arrayFilters: [{ "sessionItem._id": id(sessionItemId) }],
            projection: {
                customer: { socketId: 1, customerId: 1, },
                timing: { ordered: 1, },
                waiterRequests: { active: 1 },
                items: { _id: 1, status: 1 }
            }
        }
    );

    if (update.ok != 1) {
        return res.send({ updated: false });
    }

    if (!update.session) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    let amountOfItemsServed = 0;
    for (let item of update.session.items) {
        if (item.status == "served" || item.status == "removed") {
            amountOfItemsServed++;
        }
        if (item._id.equals(sessionItemId)) {
            if (item.status != "served") {
                return res.send({ updated: false });
            }
        }
    }
    for(let request of update.session.waiterRequests) {
        if(request.active) {
            amountOfItemsServed--;
            break;
        }
    }

    if (update.session.items.length == amountOfItemsServed) {
        const sessionDone = await addOrder(restaurant, update.session._id);
    }



    res.send({ updated: true });

    sendItemIsServed(restaurant._id, location, { sessionId: update.session._id, sessionItemId: id(sessionItemId) });
    sendToCustomerItemStatus(restaurant._id, update.session?.customer.socketId!, { sessionItemId: id(sessionItemId), status: "served" });
});



export {
    router as WaiterRouter,
}