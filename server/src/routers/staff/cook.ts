import { Router } from "express";
import { Locals } from "../../models/general.js";
import { SessionItem, WaiterRequest } from "../../models/session.js";
import { stripe } from "../../setup/stripe.js";
import { convertMultipleSessionsSessionItems, convertOneSessionItem } from "../../utils/convertSessionItems.js";
import { id } from "../../utils/id.js";
import { updateIngredientsUsage } from "../../utils/ingredients.js";
import { getItem } from "../../utils/items.js";
import { logged } from "../../utils/middleware/auth.js";
import { restaurantWorker } from "../../utils/middleware/restaurant.js";
import { addOrder } from "../../utils/orders.js";
import { getSession, getSessions, updateSession } from "../../utils/sessions.js";
import { sendToCustomerItemStatus } from "../../utils/socket/customer.js";
import { sendItemIsDone, sendItemIsQuitted, sendItemIsTaken } from "../../utils/socket/items.js";
import { sendToWaiterWaiterRequest } from "../../utils/socket/waiterRequest.js";
import { getDelay } from "../../utils/time.js";
import { getUser } from "../../utils/users.js";



const router = Router({ mergeParams: true });



router.get("/items", logged(), restaurantWorker({}, { work: { cook: true } }), async (req, res) => {
    const { restaurant, location, user } = res.locals as Locals;


    const sessions = await getSessions(restaurant._id, { status: "progress", "info.location": location  }, { projection: { items: 1, info: 1, customer: 1, timing: 1, } }).toArray();

    if(!sessions) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const convertedOrderItems = await convertMultipleSessionsSessionItems({
        restaurantId: restaurant._id,
        sessions,
        skipStatuses: ["served", "removed", "cooked"]
    });
    
    res.send(convertedOrderItems);
});

router.get("/modifiers", logged(), restaurantWorker({ }, { work: { cook: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { itemId, sessionItemId } = req.query;

    if(typeof itemId != "string" || itemId.length != 24) {
        return res.status(400).send({ reason: "InvalidItemId" });
    }
    if(typeof sessionItemId != "string" || sessionItemId.length != 24) {
        return res.status(400).send({ reason: "InvalidSessionItemId" });
    }

    const session = await getSession(
        restaurant._id,
        { items: { $elemMatch: { _id: id(sessionItemId) } } },
        { projection: { items: { _id: 1, modifiers: 1 } } },
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
        return res.send({ modifiers: [] });
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
    

    res.send({ modifiers: result });
});


router.put("/take", logged({ info: { name: 1, }, avatar: { buffer: 1 } }), restaurantWorker({ }, { work: { cook: true } }), async (req, res) => {
    const { restaurant, user, location } = res.locals as Locals;
    const { sessionId, sessionItemId } = req.body;


    if(!sessionId) {
        return res.status(400).send({ reason: "SessionIdNotProvided"});
    }
    if(!sessionItemId) {
        return res.status(400).send({ reason: "SessionItemIdNotProvided"});
    }

    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId), items: { $elemMatch: { _id: id(sessionItemId), status: "ordered" } } },
        { $set: {
            "items.$[sessionItem].timing.taken": Date.now(),
            "items.$[sessionItem].staff.cook": user._id,
            "items.$[sessionItem].status": "cooking",
        } },
        {
            arrayFilters: [ { "sessionItem._id": id(sessionItemId) } ],
            projection: { items: { _id: 1, staff: { cook: 1 } }, customer: { socketId: 1, } }
        }
    );

    if(update.session?.items) {
        for(let item of update.session.items) {
            if(item._id.equals(sessionItemId)) {
                if(!item.staff?.cook?.equals(user._id)) {
                    return res.status(500).send({ reason: "InvalidError" });
                }
            }
        }
    }


    res.send({ updated: update.ok == 1, cook: { name: `${user.info?.name?.first} ${user.info?.name?.last}`, _id: user._id, avatar: user.avatar?.buffer }, time: { hours: 0, minutes: 0, nextMinute: 59500 } });

    sendItemIsTaken(
        restaurant._id,
        location,
        {
            sessionId: id(sessionId),
            sessionItemId: id(sessionItemId),
            cook: {
                name: `${user.info?.name?.first} ${user.info?.name?.last}`,
                avatar: user.avatar?.buffer,
                _id: user._id,
            }
        }
    );

    sendToCustomerItemStatus(restaurant._id, update.session?.customer.socketId!, { sessionItemId: id(sessionItemId), status: "cooking" });
});
router.put("/quit", logged({}), restaurantWorker({ }, { work: { cook: true } }), async (req, res) => {
    const { restaurant, user, location } = res.locals as Locals;
    const { sessionId, sessionItemId } = req.body;


    if(!sessionId) {
        return res.status(400).send({ reason: "SessionIdNotProvided"});
    }
    if(!sessionItemId) {
        return res.status(400).send({ reason: "SessionItemIdNotProvided"});
    }

    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId), items: { $elemMatch: { _id: id(sessionItemId), status: "cooking" } } },
        { $set: {
            "items.$[sessionItem].timing.taken": null,
            "items.$[sessionItem].staff.cook": null,
            "items.$[sessionItem].status": "ordered",
        } },
        {
            arrayFilters: [ { "sessionItem._id": id(sessionItemId) } ],
            projection: { items: { _id: 1, staff: { cook: 1 } }, customer: { socketId: 1 } }
        }
    );

    if(update.session?.items) {
        for(let item of update.session.items) {
            if(item._id.equals(sessionItemId)) {
                if(item.staff?.cook?.equals(user._id)) {
                    return res.status(500).send({ reason: "InvalidError" });
                }
            }
        }
    }


    res.send({ updated: update.ok == 1, });

    sendItemIsQuitted(restaurant._id, location, { sessionId: id(sessionId), sessionItemId: id(sessionItemId) });
    sendToCustomerItemStatus(restaurant._id, update.session?.customer.socketId!, { sessionItemId: id(sessionItemId), status: "ordered" });
});
router.put("/done", logged(), restaurantWorker({ }, { work: { cook: true } }), async (req, res) => {
    const { restaurant, location, user } = res.locals as Locals;
    const { sessionId, sessionItemId } = req.body;


    if(!sessionId) {
        return res.status(400).send({ reason: "SessionIdNotProvided"});
    }
    if(!sessionItemId) {
        return res.status(400).send({ reason: "SessionItemIdNotProvided"});
    }

    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId), items: { $elemMatch: { _id: id(sessionItemId), status: "cooking", "staff.cook": user._id } } },
        { $set: {
            "items.$[sessionItem].timing.cooked": Date.now(),
            "items.$[sessionItem].status": "cooked",
        } },
        {
            arrayFilters: [ { "sessionItem._id": id(sessionItemId) } ],
            projection: { items: 1, timing: { ordered: 1, }, info: { comment: 1, type: 1, id: 1, }, customer: { customerId: 1, socketId: 1 } }
        }
    );

    let sessionItem: SessionItem;

    if(update.session?.items) {
        for(let item of update.session.items) {
            if(item._id.equals(sessionItemId)) {
                sessionItem = item;
                if(item.status != "cooked") {
                    return res.status(500).send({ reason: "InvalidError" });
                }
            }
        }
    }

    if(!sessionItem!) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }



    res.send({ updated: update.ok == 1, });

    const convertedSessionItem = await convertOneSessionItem({
        restaurantId: restaurant._id,
        customerId: update.session?.customer.customerId!,
        ordered: update.session?.timing.ordered!,
        sessionId: update.session?._id!,
        sessionItem: sessionItem!,
        comment: update.session?.info.comment,
        type: update.session?.info.type!,
        id: update.session?.info.id!,
    });

    if(!convertedSessionItem) {
        return;
    }

    sendItemIsDone(
        restaurant._id,
        location,
        convertedSessionItem,
    );
    sendToCustomerItemStatus(restaurant._id, update.session?.customer.socketId!, { sessionItemId: id(sessionItemId), status: "cooked" });

    updateIngredientsUsage(restaurant._id, sessionItem.itemId);
});

router.put("/remove", logged(), restaurantWorker({ customers: { userId: 1, }, stripe: { stripeAccountId: 1 } }, { work: { cook: true }, cook: { refunding: true } }), async (req, res) => {
    const { sessionId, sessionItemId, reason } = req.body;
    const { location, restaurant, user } = res.locals as Locals;


    if(!restaurant.stripe?.stripeAccountId) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    if(!sessionId || !sessionItemId || !reason) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(typeof reason != "string" || typeof sessionId != "string" || typeof sessionItemId != "string" || sessionId.length != 24 || sessionItemId.length != 24) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    if(!["other", "scam", "ingredients"].includes(reason)) {
        return res.status(400).send({ reason: "InvalidReason" });
    }



    const session = await getSession(
        restaurant._id,
        { _id: id(sessionId) },
        { projection: {
            items: { removed: 1, status: 1, _id: 1, itemId: 1, },
            info: {
                type: 1,
                id: 1,
            },
            waiterRequests: { active: 1 },
            payment: 1,
            timing: { ordered: 1 },
            customer: { customerId: 1, socketId: 1, },
        } }
    );


    if(!session) {
        return res.status(404).send({ reason: "SessionNotFound" });
    }

    let item: SessionItem = null!;
    for(let d of session.items) {
        if(d._id.equals(sessionItemId)) {
            item = d;
            break;
        }
    }
    if(!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }

    if(item.status == "removed" || item.removed) {
        return res.status(403).send({ reason: "Removed" });
    }

    if(item.status != "ordered") {
        return res.status(403).send({ reason: "Status" });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId) },
        { $set: {
            "items.$[item].status": "removed",
            "items.$[item].removed": {
                time: Date.now(),
                userId: user._id,
                reason: reason
            },
        } },
        {
            arrayFilters: [ { "item._id": id(sessionItemId) } ],
            projection: {
                _id: 1,
                items: { status: 1, _id: 1, }
            }
        }
    );


    if(update.ok == 0 || !update.session) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    let itemsDoneAmount = 0;
    for(let d of update.session.items) {
        if(d._id.equals(sessionItemId)) {
            if(d.status != "removed") {
                return res.status(500).send({ reason: "InvalidError" });
            }
        }
        if(d.status == "removed" || d.status == "served") {
            itemsDoneAmount++;
        }
    }
    for(let request of session.waiterRequests) {
        if(request.active) {
            itemsDoneAmount--; // so the session status is not done yet.
            break;
        }
    }

    if(itemsDoneAmount == session.items.length && session.payment?.method != "cash") { // method has to be not cash because if it is cash then waiter request should be created and waiter has to go and refund. then /requests/resolve will do the job
        updateSession(restaurant._id, { _id: session._id, }, { $set: { "status": "done" } }, { projection: { _id: 1 } });

        addOrder(restaurant, session._id);
    }

    const d = await getItem(restaurant._id, { _id: item.itemId }, { projection: { info: { price: 1 } } });

    if(session.payment?.method == "cash") {

        // send message to customer
        sendToCustomerItemStatus(restaurant._id, session.customer.socketId, { sessionItemId: id(sessionItemId), status: "removed" }); // send item status to the customer
        


        // send waiter request to waiter (cash refund)
        const newRequest: WaiterRequest = {
            _id: id(),
            active: true,
            reason: "refund",
            amount: d?.info.price,
            requestedTime: Date.now(),
        };
    
        updateSession(restaurant._id, { _id: session._id }, { $push: { waiterRequests: newRequest } }, { noResponse: true, projection: { _id: 1, } });

        const customer = await getUser({ _id: session.customer.customerId! }, { projection: { info: { name: 1, }, avatar: { buffer: 1 } } });

        sendToWaiterWaiterRequest(restaurant._id, location, {
            _id: newRequest._id,
            sessionId: session._id,
            customer: { name: `${ customer.info?.name?.first } ${customer.info?.name?.last }`, avatar: customer?.avatar?.buffer },
            requestedTime: getDelay(newRequest.requestedTime),
            self: false,
            reason: "cash",
            sessionType: session.info.type,
            sessionIdNumber: session.info.id,
    
            ui: {
                acceptButtonText: "Accept",
                cancelButtonText: "Cancel",
                resolveButtonText: "Refunded",
                acceptedTitle: `Refunded $${d?.info.price} to the customer`,
                reasonTitle: "Refund money",
                typeTitle: session.info.type == "dinein" ? "Table" : "Take out",
                idTitle: "#" + session.info.id,
            }
        });

        return res.send({ updated: true });
    }

    try {

        if(!d) {
            return res.status(400).send({ reason: "ItemRemoved" });
        }

        const refund = await stripe.refunds.create({
            payment_intent: session.payment?.paymentIntentId!,
            amount: d.info.price,
            reverse_transfer: true,
        });
        
    } catch (e) {
        // send message to the customer
        sendToCustomerItemStatus(restaurant._id, session.customer.socketId, { sessionItemId: id(sessionItemId), status: "removed" }); // send item status to the customer


        // send waiter request to waiter (cash refund)
        const newRequest: WaiterRequest = {
            _id: id(),
            active: true,
            reason: "refund",
            amount: d?.info.price,
            requestedTime: Date.now(),
        };

        updateSession(restaurant._id, { _id: session._id }, { $push: { waiterRequests: newRequest } }, { noResponse: true, projection: { _id: 1, } });

        const customer = await getUser({ _id: session.customer.customerId! }, { projection: { info: { name: 1, }, avatar: { buffer: 1 } } });

        sendToWaiterWaiterRequest(restaurant._id, location, {
            _id: newRequest._id,
            sessionId: session._id,
            customer: { name: `${ customer.info?.name?.first } ${customer.info?.name?.last }`, avatar: customer?.avatar?.buffer },
            requestedTime: getDelay(newRequest.requestedTime),
            self: false,
            reason: "cash",
            sessionType: session.info.type,
            sessionIdNumber: session.info.id,
    
            ui: {
                acceptButtonText: "Accept",
                cancelButtonText: "Cancel",
                resolveButtonText: "Refunded",
                acceptedTitle: `Refunded $${d?.info.price} to the customer`,
                reasonTitle: "Refund money",
                typeTitle: session.info.type == "dinein" ? "Table" : "Take out",
                idTitle: "#" + session.info.id,
            }
        });
        

        console.log(e);

        return res.send({ updated: true, });
    }

    // send message to customer
    sendToCustomerItemStatus(restaurant._id, session.customer.socketId, { sessionItemId: id(sessionItemId), status: "removed" }); // send item status to the customer
    return res.send({ updated: true });
});





export {
    router as CookRouter,
}