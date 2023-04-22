import { Router } from "express";
import { Locals } from "../../models/general.js";
import { SessionItem, WaiterRequest } from "../../models/session.js";
import { stripe } from "../../setup/stripe.js";
import { convertMultipleSessionsSessionItems, convertOneSessionItem } from "../../utils/convertSessionItems.js";
import { id } from "../../utils/other/id.js";
import { updateIngredientsUsage } from "../../utils/data/ingredients.js";
import { getItem } from "../../utils/data/items.js";
import { logged } from "../../middleware/auth.js";
import { restaurantWorker } from "../../middleware/restaurant.js";
import { addOrder } from "../../utils/data/orders.js";
import { getSession, getSessions, updateSession } from "../../utils/data/sessions.js";
import { sendToCustomerItemStatus } from "../../utils/socket/customer.js";
import { sendItemIsDone, sendItemIsQuitted, sendItemIsRemoved, sendItemIsTaken } from "../../utils/socket/items.js";
import { sendToKitchenDisposeOrder, sendToWaiterWaiterRequest } from "../../utils/socket/waiterRequest.js";
import { getDelay } from "../../utils/other/time.js";
import { getUser } from "../../utils/data/users.js";
import { itemsDBName } from "../../config.js";



const router = Router({ mergeParams: true });



router.get("/items", logged(), restaurantWorker({}, { work: { cook: true } }), async (req, res) => {
    const { restaurant, location, user } = res.locals as Locals;


    const sessions = await getSessions(restaurant._id, { status: "progress", "info.location": location,  }, { projection: { items: 1, info: 1, customer: 1, timing: 1, } }).toArray();

    if(!sessions) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const convertedOrderItems = await convertMultipleSessionsSessionItems({
        restaurantId: restaurant._id,
        sessions,
        skipStatuses: ["served", "removed", "cooked", "disposed", "cooked:disposing"],
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



router.put("/take", logged({ avatar: 1, info: { name: 1 } }), restaurantWorker({ customers: { userId: 1, } }, { work: { cook: true } }), async (req, res) => {
    const { restaurant, user, location } = res.locals as Locals;
    const { sessionId, sessionItemId } = req.body;

    // update the session item to cooking
    const update = await updateSession(
        restaurant._id,
        // the session should have the item with the id
        // the item should have the status ordered
        { _id: id(sessionId), items: { $elemMatch: { _id: id(sessionItemId), status: "ordered" } } },
        { $set: {
            "items.$[sessionItem].timing.taken": Date.now(),
            "items.$[sessionItem].staff.cook": user._id,
            "items.$[sessionItem].status": "cooking",
        } },
        { arrayFilters: [ { "sessionItem._id": id(sessionItemId) } ], projection: { customer: { socketId: 1 }, items: { status: 1, _id: 1, }, info: { type: 1, delivery: { status: 1 } }, } }
    );

    if(update.ok == 0) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const session = update.session;
    
    // if session was not found
    // or the cook was not added
    // or the session item was not found
    // send an error
    if(!session) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    // map the session items
    // if the session item with the sessionId has status different to "cooking" return an error
    // implement a for loop to check if all the items are cooking
    for(const item of session.items) {
        if(item._id.equals(sessionItemId)) {
            if(item.status != "cooking") {
                return res.status(500).send({ reason: "InvalidError" });
            }
        }
    }

    // now check if the session is valid
    // check if the session is delivery and delivery status is not cancelled
    // if the session is delivery and delivery status is cancelled you have to change all the dishes statuses to disposing or removed
    // change dish status to removed if dish status is ordered
    // change dish status to disposing if dish status is cooking or cooked
    if(session.info.type == "delivery" && session.info.delivery?.status == "DELIVERY_CANCELLED") {
        let itemsDone = 0;
        for(const item of session.items) {
            if(item.status == "ordered" || item.status == "removed" || item.status == "disposed") {
                itemsDone++;
            }
        }

        // if all items are disposed or removed, update the session so the status is done
        // update ordered items to removed
        if(itemsDone == session.items.length) {
            const newest = await updateSession(
                restaurant._id,
                { _id: session._id },
                { $set: {
                    status: "done",
                    "items.$[removeItems].status": "removed",
                } },
                { arrayFilters: [ { "removeItems.status": "ordered" }, ], }
            );

            // add the session to orders
            addOrder(restaurant._id, restaurant.customers, newest.session!);
        }
        // if not, update the session so the items that are ordered are removed and the items that are cooking or cooked are disposing
        else {
            updateSession(
                restaurant._id,
                { _id: session._id },
                { $set: {
                    "items.$[removeItems].status": "removed",
                    "items.$[cooked].status": "cooked:disposing",
                    "items.$[cooking].status": "cooking:disposing",
                } },
                { arrayFilters: [ { "removeItems.status": "ordered" }, { "cooked.status": "cooked" }, { "cooking:status": "cooking" } ], }
            );
        }

        // send to customer that the session is done and refund the money
        sendToCustomerItemStatus(restaurant._id, session.customer.socketId!, { sessionItemId: id(sessionItemId), status: "removed", });

        // send to staff to remove the items with ordered status and dispose items with cooking or cooked status
        sendToKitchenDisposeOrder(restaurant._id, location, { sessionId: session._id });


        return res.status(400).send({ reason: "OrderRemoved" });
    }


    res.send({ updated: true, cook: { name: `${user.info?.name?.first} ${user.info?.name?.last}`, _id: user._id, avatar: user.avatar?.buffer }, time: { hours: 0, minutes: 0, nextMinute: 59500 } });

    // send to staff that the item is taken
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

    // send to customer that the item is cooking
    sendToCustomerItemStatus(restaurant._id, session.customer.socketId!, { sessionItemId: id(sessionItemId), status: "cooking" });
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
            projection: { items: 1, timing: { ordered: 1, }, info: { comment: 1, type: 1, id: 1, delivery: { time: 1, } }, customer: { customerId: 1, socketId: 1 } }
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
        deliveryTime: update.session?.info.delivery?.time,
        customerId: update.session?.customer.customerId!,
        ordered: update.session?.timing.ordered!,
        comment: update.session?.info.comment,
        type: update.session?.info.type!,
        sessionId: update.session?._id!,
        restaurantId: restaurant._id,
        id: update.session?.info.id!,
        sessionItem: sessionItem!,
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
router.put("/dispose", logged(), restaurantWorker({ }, { work: { cook: true } }), async (req, res) => {
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
        { _id: id(sessionId), items: { $elemMatch: { _id: id(sessionItemId), status: "cooking:disposing", "staff.cook": user._id } } },
        { $set: {
            "items.$[sessionItem].timing.disposed": Date.now(),
            "items.$[sessionItem].status": "disposed",
        } },
        {
            arrayFilters: [ { "sessionItem._id": id(sessionItemId) } ],
            projection: {  }
        }
    );

    if(!update.session) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    let sessionItem: SessionItem;

    if(update.session?.items) {
        for(let item of update.session.items) {
            if(item._id.equals(sessionItemId)) {
                sessionItem = item;
                if(item.status != "disposed") {
                    return res.status(500).send({ reason: "InvalidError" });
                }
            }
        }
    }
    let amountOfItemsServed = 0;
    for (let item of update.session.items) {
        if (item.status == "served" || item.status == "removed" || item.status == "disposed") {
            amountOfItemsServed++;
        }
        if (item._id.equals(sessionItemId)) {
            if (item.status != "disposed") {
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
        const sessionDone = await addOrder(restaurant._id, restaurant.customers, update.session);
    }

    if(!sessionItem!) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }



    res.send({ updated: update.ok == 1, });

    sendToCustomerItemStatus(restaurant._id, update.session?.customer.socketId!, { sessionItemId: id(sessionItemId), status: "disposed" });
    sendItemIsRemoved(restaurant._id, update.session?.info.location!, { sessionItemId: id(sessionItemId), sessionId: id(sessionId) });
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
        const update = await updateSession(restaurant._id, { _id: session._id, }, { $set: { "status": "done" } }, {  });

        addOrder(restaurant._id, restaurant.customers, update.session!);
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