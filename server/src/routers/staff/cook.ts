import { Router } from "express";
import { Locals } from "../../models/general.js";
import { SessionDish } from "../../models/session.js";
import { convertMultipleSessionsSessionDishes, convertOneSessionDish } from "../../utils/convertSessionDishes.js";
import { updateDish } from "../../utils/dishes.js";
import { id } from "../../utils/id.js";
import { updateIngredientsUsage } from "../../utils/ingredients.js";
import { logged } from "../../utils/middleware/auth.js";
import { restaurantWorker } from "../../utils/middleware/restaurant.js";
import { getSessions, updateSession } from "../../utils/sessions.js";
import { sendToCustomerDishStatus } from "../../utils/socket/customer.js";
import { sendDishIsDone, sendDishIsQuitted, sendDishIsTaken } from "../../utils/socket/dishes.js";



const router = Router({ mergeParams: true });



router.get("/dishes", logged(), restaurantWorker({}, { work: { cook: true } }), async (req, res) => {
    const { restaurant, location } = res.locals as Locals;


    const sessions = await getSessions(restaurant._id, { status: "progress", "info.location": location  }, { projection: { dishes: 1, info: 1, customer: 1, timing: 1, } }).toArray();

    if(!sessions) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const convertedOrderDishes = await convertMultipleSessionsSessionDishes(restaurant._id, sessions, ["served", "removed", "cooked"]);
    
    res.send(convertedOrderDishes);
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
        { _id: id(sessionId) },
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


    res.send({ updated: update.ok == 1, cook: { name: `${user.info?.name?.first} ${user.info?.name?.last}`, avatar: user.avatar?.buffer }, time: { hours: 0, minutes: 0, nextMinute: 59500 } });

    sendDishIsTaken(restaurant._id, location, { sessionId: id(sessionId), sessionDishId: id(sessionDishId), cook: { name: `${user.info?.name?.first} ${user.info?.name?.last}`, avatar: user.avatar?.buffer } });
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
        { _id: id(sessionId) },
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
    const { restaurant, location } = res.locals as Locals;
    const { sessionId, sessionDishId } = req.body;


    if(!sessionId) {
        return res.status(400).send({ reason: "SessionIdNotProvided"});
    }
    if(!sessionDishId) {
        return res.status(400).send({ reason: "SessionDishIdNotProvided"});
    }

    const update = await updateSession(
        restaurant._id,
        { _id: id(sessionId) },
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





export {
    router as CookRouter,
}