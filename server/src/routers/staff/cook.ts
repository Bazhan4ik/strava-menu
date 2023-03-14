import { Router } from "express";
import { getDecorators } from "typescript";
import { dishesDBName } from "../../config.js";
import { Locals } from "../../models/general.js";
import { SessionDish, WaiterRequest } from "../../models/session.js";
import { stripe } from "../../setup/stripe.js";
import { convertMultipleSessionsSessionDishes, convertOneSessionDish } from "../../utils/convertSessionDishes.js";
import { getDish } from "../../utils/dishes.js";
import { id } from "../../utils/id.js";
import { updateIngredientsUsage } from "../../utils/ingredients.js";
import { logged } from "../../utils/middleware/auth.js";
import { restaurantWorker } from "../../utils/middleware/restaurant.js";
import { addOrder } from "../../utils/orders.js";
import { updateRestaurant } from "../../utils/restaurant.js";
import { getSession, getSessions, updateSession } from "../../utils/sessions.js";
import { sendToCustomerDishStatus } from "../../utils/socket/customer.js";
import { sendDishIsDone, sendDishIsQuitted, sendDishIsTaken } from "../../utils/socket/dishes.js";
import { sendToCustomerAcceptWaiterRequest, sendToWaiterWaiterRequest } from "../../utils/socket/waiterRequest.js";
import { getDelay } from "../../utils/time.js";
import { getUser } from "../../utils/users.js";



const router = Router({ mergeParams: true });



router.get("/dishes", logged(), restaurantWorker({}, { work: { cook: true } }), async (req, res) => {
    const { restaurant, location, user } = res.locals as Locals;


    const sessions = await getSessions(restaurant._id, { status: "progress", "info.location": location  }, { projection: { dishes: 1, info: 1, customer: 1, timing: 1, } }).toArray();

    if(!sessions) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const convertedOrderDishes = await convertMultipleSessionsSessionDishes({
        restaurantId: restaurant._id,
        sessions,
        skipStatuses: ["served", "removed", "cooked"]
    });
    
    res.send(convertedOrderDishes);
});

router.get("/modifiers", logged(), restaurantWorker({ }, { work: { cook: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { dishId, sessionDishId } = req.query;

    if(typeof dishId != "string" || dishId.length != 24) {
        return res.status(400).send({ reason: "InvalidDishId" });
    }
    if(typeof sessionDishId != "string" || sessionDishId.length != 24) {
        return res.status(400).send({ reason: "InvalidSessionDishId" });
    }

    const session = await getSession(
        restaurant._id,
        { dishes: { $elemMatch: { _id: id(sessionDishId) } } },
        { projection: { dishes: { _id: 1, modifiers: 1 } } },
    );

    if(!session) {
        return res.status(404).send({ reason: "SesssionNotFound" });
    }

    const getSelectedModifiers = () => {
        for(const dish of session.dishes) {
            if(dish._id.equals(sessionDishId)) {
                return dish.modifiers || [];
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

    const dish = await getDish(
        restaurant._id,
        { _id: id(dishId) },
        { projection: { modifiers: { _id: 1, name: 1, options: { _id: 1, name: 1} } } }
    );

    if(!dish) {
        return res.status(404).send({ reason: "DishNotFound" });
    }
    if(!dish.modifiers) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const result = [];

    for(const dishModifier of modifiers) {
        for(const modifier of dish.modifiers) {
            if(dishModifier._id.equals(modifier._id)) {
                const options: string[] = [];

                for(const selected of dishModifier.selected) {
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
    const { sessionId, sessionDishId } = req.body;


    if(!sessionId) {
        return res.status(400).send({ reason: "SessionIdNotProvided"});
    }
    if(!sessionDishId) {
        return res.status(400).send({ reason: "SessionDishIdNotProvided"});
    }

    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId), dishes: { $elemMatch: { _id: id(sessionDishId), status: "ordered" } } },
        { $set: {
            "dishes.$[sessionDish].timing.taken": Date.now(),
            "dishes.$[sessionDish].staff.cook": user._id,
            "dishes.$[sessionDish].status": "cooking",
        } },
        {
            arrayFilters: [ { "sessionDish._id": id(sessionDishId) } ],
            projection: { dishes: { _id: 1, staff: { cook: 1 } }, customer: { socketId: 1, } }
        }
    );

    if(update.session?.dishes) {
        for(let dish of update.session.dishes) {
            if(dish._id.equals(sessionDishId)) {
                if(!dish.staff?.cook?.equals(user._id)) {
                    return res.status(500).send({ reason: "InvalidError" });
                }
            }
        }
    }


    res.send({ updated: update.ok == 1, cook: { name: `${user.info?.name?.first} ${user.info?.name?.last}`, _id: user._id, avatar: user.avatar?.buffer }, time: { hours: 0, minutes: 0, nextMinute: 59500 } });

    sendDishIsTaken(
        restaurant._id,
        location,
        {
            sessionId: id(sessionId),
            sessionDishId: id(sessionDishId),
            cook: {
                name: `${user.info?.name?.first} ${user.info?.name?.last}`,
                avatar: user.avatar?.buffer,
                _id: user._id,
            }
        }
    );

    sendToCustomerDishStatus(restaurant._id, update.session?.customer.socketId!, { sessionDishId: id(sessionDishId), status: "cooking" });
});
router.put("/quit", logged({}), restaurantWorker({ }, { work: { cook: true } }), async (req, res) => {
    const { restaurant, user, location } = res.locals as Locals;
    const { sessionId, sessionDishId } = req.body;


    if(!sessionId) {
        return res.status(400).send({ reason: "SessionIdNotProvided"});
    }
    if(!sessionDishId) {
        return res.status(400).send({ reason: "SessionDishIdNotProvided"});
    }

    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId), dishes: { $elemMatch: { _id: id(sessionDishId), status: "cooking" } } },
        { $set: {
            "dishes.$[sessionDish].timing.taken": null,
            "dishes.$[sessionDish].staff.cook": null,
            "dishes.$[sessionDish].status": "ordered",
        } },
        {
            arrayFilters: [ { "sessionDish._id": id(sessionDishId) } ],
            projection: { dishes: { _id: 1, staff: { cook: 1 } }, customer: { socketId: 1 } }
        }
    );

    if(update.session?.dishes) {
        for(let dish of update.session.dishes) {
            if(dish._id.equals(sessionDishId)) {
                if(dish.staff?.cook?.equals(user._id)) {
                    return res.status(500).send({ reason: "InvalidError" });
                }
            }
        }
    }


    res.send({ updated: update.ok == 1, });

    sendDishIsQuitted(restaurant._id, location, { sessionId: id(sessionId), sessionDishId: id(sessionDishId) });
    sendToCustomerDishStatus(restaurant._id, update.session?.customer.socketId!, { sessionDishId: id(sessionDishId), status: "ordered" });
});
router.put("/done", logged(), restaurantWorker({ }, { work: { cook: true } }), async (req, res) => {
    const { restaurant, location, user } = res.locals as Locals;
    const { sessionId, sessionDishId } = req.body;


    if(!sessionId) {
        return res.status(400).send({ reason: "SessionIdNotProvided"});
    }
    if(!sessionDishId) {
        return res.status(400).send({ reason: "SessionDishIdNotProvided"});
    }

    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId), dishes: { $elemMatch: { _id: id(sessionDishId), status: "cooking", "staff.cook": user._id } } },
        { $set: {
            "dishes.$[sessionDish].timing.cooked": Date.now(),
            "dishes.$[sessionDish].status": "cooked",
        } },
        {
            arrayFilters: [ { "sessionDish._id": id(sessionDishId) } ],
            projection: { dishes: 1, timing: { ordered: 1, }, info: { comment: 1 }, customer: { customerId: 1, socketId: 1 } }
        }
    );

    let sessionDish: SessionDish;

    if(update.session?.dishes) {
        for(let dish of update.session.dishes) {
            if(dish._id.equals(sessionDishId)) {
                sessionDish = dish;
                if(dish.status != "cooked") {
                    return res.status(500).send({ reason: "InvalidError" });
                }
            }
        }
    }

    if(!sessionDish!) {
        return res.status(404).send({ reason: "DishNotFound" });
    }



    res.send({ updated: update.ok == 1, });

    const convertedSessionDish = await convertOneSessionDish({
        restaurantId: restaurant._id,
        customerId: update.session?.customer.customerId!,
        ordered: update.session?.timing.ordered!,
        sessionId: update.session?._id!,
        sessionDish: sessionDish!,
        comment: update.session?.info.comment,
    });

    if(!convertedSessionDish) {
        return;
    }

    sendDishIsDone(
        restaurant._id,
        location,
        convertedSessionDish,
    );
    sendToCustomerDishStatus(restaurant._id, update.session?.customer.socketId!, { sessionDishId: id(sessionDishId), status: "cooked" });

    updateIngredientsUsage(restaurant._id, sessionDish.dishId);
});

router.put("/remove", logged(), restaurantWorker({ customers: { userId: 1, }, stripe: { stripeAccountId: 1 } }, { work: { cook: true }, cook: { refunding: true } }), async (req, res) => {
    const { sessionId, sessionDishId, reason } = req.body;
    const { location, restaurant, user } = res.locals as Locals;


    if(!restaurant.stripe?.stripeAccountId) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    if(!sessionId || !sessionDishId || !reason) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(typeof reason != "string" || typeof sessionId != "string" || typeof sessionDishId != "string" || sessionId.length != 24 || sessionDishId.length != 24) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    if(!["other", "scam", "ingredients"].includes(reason)) {
        return res.status(400).send({ reason: "InvalidReason" });
    }



    const session = await getSession(
        restaurant._id,
        { _id: id(sessionId) },
        { projection: {
            dishes: { removed: 1, status: 1, _id: 1, dishId: 1, },
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

    let dish: SessionDish = null!;
    for(let d of session.dishes) {
        if(d._id.equals(sessionDishId)) {
            dish = d;
            break;
        }
    }
    if(!dish) {
        return res.status(404).send({ reason: "DishNotFound" });
    }

    if(dish.status == "removed" || dish.removed) {
        return res.status(403).send({ reason: "Removed" });
    }

    if(dish.status != "ordered") {
        return res.status(403).send({ reason: "Status" });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId) },
        { $set: {
            "dishes.$[dish].status": "removed",
            "dishes.$[dish].removed": {
                time: Date.now(),
                userId: user._id,
                reason: reason
            },
        } },
        {
            arrayFilters: [ { "dish._id": id(sessionDishId) } ],
            projection: {
                _id: 1,
                dishes: { status: 1, _id: 1, }
            }
        }
    );


    if(update.ok == 0 || !update.session) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    let dishesDoneAmount = 0;
    for(let d of update.session.dishes) {
        if(d._id.equals(sessionDishId)) {
            if(d.status != "removed") {
                return res.status(500).send({ reason: "InvalidError" });
            }
        }
        if(d.status == "removed" || d.status == "served") {
            dishesDoneAmount++;
        }
    }
    for(let request of session.waiterRequests) {
        if(request.active) {
            dishesDoneAmount--; // so the session status is not done yet.
            break;
        }
    }

    if(dishesDoneAmount == session.dishes.length && session.payment?.method != "cash") { // method has to be not cash because if it is cash then waiter request should be created and waiter has to go and refund. then /requests/resolve will do the job
        updateSession(restaurant._id, { _id: session._id, }, { $set: { "status": "done" } }, { projection: { _id: 1 } });

        addOrder(restaurant, session._id);
    }

    const d = await getDish(restaurant._id, { _id: dish.dishId }, { projection: { info: { price: 1 } } });

    if(session.payment?.method == "cash") {

        // send message to customer
        sendToCustomerDishStatus(restaurant._id, session.customer.socketId, { sessionDishId: id(sessionDishId), status: "removed" }); // send dish status to the customer
        


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
            return res.status(400).send({ reason: "DishRemoved" });
        }

        const refund = await stripe.refunds.create({
            payment_intent: session.payment?.paymentIntentId!,
            amount: d.info.price,
            reverse_transfer: true,
        });
        
    } catch (e) {
        // send message to the customer
        sendToCustomerDishStatus(restaurant._id, session.customer.socketId, { sessionDishId: id(sessionDishId), status: "removed" }); // send dish status to the customer


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
    sendToCustomerDishStatus(restaurant._id, session.customer.socketId, { sessionDishId: id(sessionDishId), status: "removed" }); // send dish status to the customer
    return res.send({ updated: true });
});





export {
    router as CookRouter,
}