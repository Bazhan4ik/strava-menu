import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { SessionDish, SessionType, TimelineComponent, WaiterRequest } from "../../models/session.js";
import { stripe } from "../../setup/stripe.js";
import { getDishes } from "../../utils/dishes.js";
import { id } from "../../utils/id.js";
import { customerSession } from "../../utils/middleware/customerSession.js";
import { customerRestaurant } from "../../utils/middleware/customerRestaurant.js";
import { createSession, updateSession, updateSessions } from "../../utils/sessions.js";
import { sendToWaiterCancelWaiterRequest, sendToWaiterWaiterRequest } from "../../utils/socket/waiterRequest.js";
import { joinCustomer } from "../../utils/socket/socket.js";
import { convertTime, getDelay } from "../../utils/time.js";
import { getUser } from "../../utils/users.js";
import { Location } from "../../models/restaurant.js";
import Stripe from "stripe";


const router = Router({ mergeParams: true });




router.get("/",
    customerRestaurant({ info: { name: 1, id: 1 }, tables: 1, locations: { _id: 1, id: 1, settings: { customers: 1, } } }),
    customerSession({
        info: 1,
        waiterRequests: 1,
        dishes: {
            _id: 1,
            dishId: 1,
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


        if (!session) {

            const newSessionId = id();

            const newSession = await createSession(restaurant._id, {
                _id: newSessionId,
                customer: {
                    by: "customer",
                    customerId: user?._id || null!,
                    socketId: socketId || null!,
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
                dishes: [],
                waiterRequests: [],
            });

            response.session = {
                dishes: [],
                id: table?.toString()!,
                type: location.settings.customers?.allowDineIn ? "dinein" : "takeout",
            };

            response.setSessionId = newSessionId;
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
                dishes: session.dishes.map(d => { return { dishId: d.dishId, _id: d._id, comment: d.info.comment } }),
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

router.post("/socketId", customerRestaurant({ info: { name: 1, id: 1 } }), customerSession({ info: { location: 1, } }, {}, false), async (req, res) => {
    const { restaurant, session } = res.locals as Locals;
    const { socketId } = req.body;

    if (!socketId) {
        return res.status(400).send({ reason: "SocketIdNotProvided" });
    }

    if (typeof socketId != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    joinCustomer(socketId, restaurant._id, session.info.location);

    res.send({ updated: true });
});


router.put("/comment", customerRestaurant({}), customerSession({ info: { comment: 1 } }, {}), async (req, res) => {
    const { restaurant, session } = res.locals as Locals;
    let { comment } = req.body;

    if (!comment) {
        return res.status(400).send({ reason: "CommentNotProvided" });
    }
    if (typeof comment != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    if (comment == session.info.comment) {
        return res.send({ updated: true });
    }

    if (comment == "remove") {
        comment = null!;
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id, },
        { $set: { "info.comment": comment } },
        { projection: { _id: 1 } }
    );

    res.send({ updated: update.ok == 1 });
});

router.post("/dish", customerRestaurant({}), customerSession({ info: { type: 1, id: 1 } }, { info: { name: { last: 1 } } }), async (req, res) => {
    const { restaurant, session, user } = res.locals as Locals;
    const { dishId, comment } = req.body;

    if (!dishId) {
        return res.status(400).send({ reason: "DishIdNotProvided" });
    }

    if (typeof dishId != "string" || dishId.length != 24 || (comment && typeof comment != "string")) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    const dishGeneratedId = () => {

        // 3 random numbers at the end
        const rand = Math.floor(Math.random() * 900 + 100).toString();

        // either order type first letter (T | D) and 1 number of order id or first letter of last name of the customer
        const orderIndicator = session.info.id ? session.info.type[0].toUpperCase() + session.info.id[0] : user?.info?.name?.last[0] || Math.floor(Math.random() * 90 + 10);

        return `${orderIndicator}-${rand}`;
    }

    const newDish: SessionDish = {
        dishId: id(dishId),
        _id: id(),
        status: "ordered",
        info: {
            comment: comment || null!,
            id: dishGeneratedId(),
        },
    };

    const timeline: TimelineComponent = {
        action: "dish/add",
        userId: "customer",
        time: Date.now(),
        dishId: newDish._id,
    }

    const update = await updateSession(restaurant._id, { _id: session._id, }, { $push: { dishes: newDish } }, { projection: { _id: 1, } });


    res.send({
        insertedId: newDish._id,
    });
});

router.put("/dish/:orderDishId/comment", customerRestaurant({}), customerSession({ dishes: { _id: 1, info: { comment: 1 } } }, {}), async (req, res) => {
    const { orderDishId } = req.params;
    const { session, restaurant } = res.locals as Locals;
    let { comment } = req.body;

    if (!comment) {
        return res.status(400).send({ reason: "CommentNotProvided" });
    }

    if (typeof comment != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    for (let dish of session.dishes) {
        if (dish._id.equals(orderDishId)) {
            if (dish.info.comment == comment) {
                return res.send({ updated: true });
            }
        }
    }

    if (comment == "remove") {
        comment = null;
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "dishes.$[dish].info.comment": comment } },
        { arrayFilters: [{ "dish._id": id(orderDishId) }] }
    );

    res.send({ updated: update.ok == 1 });
});

router.delete("/dish/:orderDishId", customerRestaurant({}), customerSession({}, {}), async (req, res) => {
    const { orderDishId } = req.params;
    const { restaurant, session } = res.locals as Locals;

    if (!orderDishId || orderDishId.length != 24) {
        return res.status(400).send({ reason: "InvalidId" });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $pull: { "dishes": { _id: id(orderDishId) } } },
        { projection: { _id: 1 } }
    );

    res.send({
        updated: update.ok == 1,
    });
});


router.get("/preview", customerRestaurant({ locations: { _id: 1, city: 1, line1: 1, settings: { customers: 1, } } }), customerSession({ dishes: 1, info: 1 }, {}), async (req, res) => {
    const { restaurant, session, user } = res.locals as Locals;

    const dishesId: ObjectId[] = [];

    if (!restaurant.locations) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    let location: Location = null!;
    for (let l of restaurant.locations) {
        if (session.info.location.equals(l._id)) {
            location = l;
            break;
        }
    }

    if (!location) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    for (let dish of session.dishes) {
        dishesId.push(dish.dishId);
    }

    const dishes = await getDishes(restaurant._id, { _id: { $in: dishesId } }, { projection: { info: { name: 1, price: 1, }, id: 1, library: { preview: 1, } } }).toArray();

    const convertedDishes = [];

    const findDish = (dishId: ObjectId) => {
        for (let dish of dishes) {
            if (dish._id.equals(dishId)) {
                return dish;
            }
        }
        return null!;
    }

    let subtotal = 0;

    for (let d of session.dishes) {
        const dish = findDish(d.dishId);

        if (!dish) {

            updateSession(restaurant._id, { _id: session._id }, { $pull: { dishes: { dishId: d.dishId } } }, { noResponse: true });

            continue;
        }

        convertedDishes.push({
            name: dish.info.name,
            price: dish.info.price,
            image: dish.library?.preview,
            dishId: dish.id,
            dishObjectId: dish._id,
            _id: d._id,
            comment: d.info.comment
        });

        subtotal += dish.info.price;

    }



    res.send({
        dishes: convertedDishes,
        subtotal,
        info: session.info,
        address: `${location.city}, ${location.line1}`,
        settings: {
            ...location.settings.customers
        }
    });
});



router.put("/type", customerRestaurant({}), customerSession({ info: { type: 1, id: 1, } }, {}), async (req, res) => {
    const { restaurant, session, } = res.locals as Locals;
    const { type } = req.body;

    if (!type) {
        return res.status(400).send({ reason: "TypeNotProvided" });
    }
    if (typeof type != "string" || !["dinein", "takeout"].includes(type)) {
        return res.status(422).send({ reason: "InvalidInput" });
    }


    if (session.info.type == type) {
        return res.send({ updated: true, id: session.info.id });
    }

    let id = null;

    if (type == "takeout") {
        id = Math.floor(Math.random() * 9000 + 1000).toString();
    }

    const update = await updateSession(restaurant._id, { _id: session._id }, { $set: { "info.type": type as SessionType, "info.id": id! } }, { projection: { _id: 1 } });


    res.send({ updated: update.ok == 1, id });
});
router.put("/table", customerRestaurant({ locations: { id: 1, _id: 1 }, tables: 1, }), customerSession({ info: { id: 1, location: 1, type: 1 } }, {}), async (req, res) => {
    const { session, restaurant } = res.locals as Locals;
    const { table } = req.body;

    if (!restaurant.tables || !restaurant.locations) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    if (!table || typeof table != "string" || table.length != 24) {
        return res.status(400).send({ reason: "InvalidTable" });
    }

    const getLocation = () => {
        for (let l of restaurant.locations!) {
            if (l._id.equals(session.info.location)) {
                return l.id;
            }
        }
        return null!;
    }

    const tables = restaurant.tables[getLocation().toString()];

    if (!tables) {
        return res.status(400).send({ reason: "InvalidLocation" });
    }



    let tableNumber: number = null!;

    for (let t of tables) {
        if (t._id.equals(table)) {
            tableNumber = t.id;
            break;
        }
    }

    if (!tableNumber) {
        return res.status(400).send({ reason: "InvalidTable" });
    }

    const update = await updateSession(restaurant._id, { _id: session._id }, { $set: { "info.id": tableNumber.toString() } }, { projection: { _id: 1 } });

    res.send({ updated: update.ok == 1, table: tableNumber.toString() });
});


router.put("/tip", customerRestaurant({ locations: { _id: 1, id: 1, settings: { tips: 1, } } }), customerSession({ info: { location: 1 }, payment: { money: { subtotal: 1 } } }, {}), async (req, res) => {
    const { session, restaurant } = res.locals as Locals;
    const { amount } = req.body;

    if(typeof amount != "number") {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(!restaurant.locations) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(!session.payment?.money?.subtotal || !session.info.location) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getLocation = () => {
        for (let l of restaurant.locations!) {
            if (l._id.equals(session.info.location)) {
                return l;
            }
        }
        return null!;
    }

    const location: Location = getLocation();

    if(!location) {
        return res.status(400).send({ reason: "LocationNotFound" });
    }

    if(!location.settings.tips) {
        return res.status(403).send({ reason: "TipsDisabled" });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "payment.money.tip": session.payment.money.subtotal * amount / 100 } },
        { projection: { _id: 1 } }
    );

    res.send({ updated: update.ok == 1 });
});
router.delete("/tip", customerRestaurant({}), customerSession({}, {}), async (req, res) => {
    const { session, restaurant } = res.locals as Locals;


    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "payment.money.tip": null! } },
        { projection: { _id: 1 } }
    );


    res.send({ updated: update.ok == 1 });
});



class AmountAndDishes {
    money!: { subtotal: number; hst: number; total: number; service: number; };
    dishes!: { name: string; amount: number; price: number; }[];
}
class ErrorResult {
    status!: number;
    reason!: string;
}
class SuccessfulPaymentDataResult {
    paymentIntentId!: string;
    paymentIntentClientSecret!: string;
    setupIntentClientSecret?: string;
    setupIntent?: string;
    paymentMethods?: {
        last4: string;
        id: string;
        brand: string;
    }[];
}
router.get("/checkout",
    customerRestaurant({
        stripe: { stripeAccountId: 1, },
        locations: { _id: 1, settings: 1 },
    }),
    customerSession(
        {
            payment: 1,
            info: { location: 1, type: 1, },
            dishes: { dishId: 1, _id: 1 },
        },
        {
            stripeCustomerId: 1,
            hasPaymentMethod: 1,
            info: { email: 1, },
        }
    ), async (req, res) => {

        const { session, restaurant, user } = res.locals as Locals;

        const findError = () => {
            if (!restaurant.locations) {
                return { status: 500, reason: "InvalidError" };
            }
            if (!restaurant.stripe || !restaurant.stripe.stripeAccountId) {
                return { status: 500, reason: "InvalidError" };
            }
            for (let l of restaurant.locations) {
                if (l._id.equals(session.info.location)) {
                    location = l;
                    break;
                }
            }
            if (!location) {
                return { status: 404, reason: "LocationNotFound" };
            }
        }
        const convertDishesAndCalculateMoney = async () => {
            if(session.dishes.length == 0) {
                return { status: 500, reason: "InvalidDishes" };
            }
            const result = await calculateAmount(restaurant._id, session.dishes, session.payment?.money?.tip, location.settings.serviceFee!);

            if (!result) {
                return { status: 500, reason: "InvalidDishes" };
            }
            if (!result || !result.money.total) {
                return { status: 403, reason: "InvalidAmount" };
            }
            return result;
        }
        const customerPaymentData = async (): Promise<SuccessfulPaymentDataResult | ErrorResult> => {

            const waitFor = [];

            // create payment intent
            // if customer has account list his payment methods
            // if no payment methods create setup intent

            // if customer has no accounts return payment intent client secret
            // if customer logged in return payment methods 

            // if customer want not to pay with the given methods create setup intent on other endpoint

            waitFor.push(createPaymentIntent(
                {
                    stripeAccountId: restaurant.stripe!.stripeAccountId!,
                    stripeCustomerId: user?.stripeCustomerId,
                    restaurantId: restaurant._id.toString(),
                    pid: session.payment?.paymentIntentId,
                    sessionId: session._id.toString(),
                    total: Math.floor(money.total),
                },
            ));

            if (!user) {

                // customer not logged in, create/update payment intent

                const result = await Promise.all(waitFor); // [0] paymentIntent

                const paymentIntent = result[0];

                return { paymentIntentClientSecret: paymentIntent.client_secret!, paymentIntentId: paymentIntent.id };
            }

            if (user.hasPaymentMethod) {

                // list saved payment methods

                waitFor.push(
                    stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: "card" })
                );

                const result = await Promise.all(waitFor); // [0] paymentIntent [1] paymentMethods

                const paymentIntent = result[0] as Stripe.PaymentIntent;
                const paymentMethods = result[1] as Stripe.ApiList<Stripe.PaymentMethod>;

                const convertedPaymentMethods: SuccessfulPaymentDataResult["paymentMethods"] = [];

                for (let pm of paymentMethods.data) {
                    convertedPaymentMethods.push({
                        id: pm.id,
                        last4: pm.card?.last4!,
                        brand: pm.card?.brand!,
                    });
                }


                return { paymentMethods: convertedPaymentMethods, paymentIntentClientSecret: paymentIntent.client_secret!, paymentIntentId: paymentIntent.id, };
            }

            // create setup intent

            if(session.payment?.setupIntentId) {
                waitFor.push(
                    stripe.setupIntents.retrieve(session.payment.setupIntentId)
                );
            } else {
                waitFor.push(
                    stripe.setupIntents.create({
                        customer: user.stripeCustomerId,
                        payment_method_types: ["card"],
                        metadata: {
                            restaurantId: restaurant._id.toString(),
                            sessionId: session._id.toString(),
                            userId: user._id.toString(),
                        }
                    })
                );
            }

            const result = await Promise.all(waitFor); // [0] paymentIntent [1] setupIntent

            const paymentIntent = result[0] as Stripe.PaymentIntent;
            const setupIntent = result[1] as Stripe.SetupIntent;


            setupIntent.client_secret;
            paymentIntent.client_secret;

            return {
                paymentIntentClientSecret: paymentIntent.client_secret!,
                setupIntentClientSecret: setupIntent.client_secret!,
                paymentIntentId: paymentIntent.id,
                setupIntent: setupIntent.id,
            }

        }


        let location: Location = null!;
        let money: AmountAndDishes["money"] = null!;
        let dishes: AmountAndDishes["dishes"] = null!;
        let paymentData: SuccessfulPaymentDataResult = null!;

        const error = findError();
        if (error) {
            return res.status(error.status).send({ reason: error.reason });
        }

        const calcres = await convertDishesAndCalculateMoney();
        if (calcres instanceof ErrorResult || (typeof (calcres as any).status == "number")) {
            return res.status((calcres as ErrorResult).status || 500).send({ reason: (calcres as ErrorResult).reason || "InvalidError" })
        } else {
            money = (calcres as any).money;
            dishes = (calcres as any).dishes;
        }

        if(location.settings.methods?.card) {
            const result = await customerPaymentData();
            if(result instanceof ErrorResult) {
                return res.status(result.status).send({ reason: result.reason });
            }
            paymentData = result;
        }

        res.send({
            money,
            dishes,
            payWithCard: location.settings.methods?.card,
            payWithCash: location.settings.methods?.cash && session.info.type != "takeout",
            email: user?.info?.email,
            paymentData: {
                tips: location.settings.tips,
                paymentMethods: paymentData?.paymentMethods,
                // setup: !!paymentData?.setupIntentClientSecret,
                setup: false,
                // payment: !paymentData?.setupIntent && !!paymentData?.paymentIntentId,
                payment: true,
                // clientSecret: paymentData?.setupIntentClientSecret || paymentData?.paymentIntentClientSecret,
                clientSecret: paymentData?.paymentIntentClientSecret,
            }
        });


        const update = await updateSession(restaurant._id,
            { _id: session._id, },
            {
                $set: {
                    "payment.paymentIntentId": paymentData?.paymentIntentId,
                    "payment.setupIntentId": paymentData?.setupIntent,
                    "payment.money": money,
                }
            },
            { projection: { _id: 1 } }
        );
    });

router.put("/request/cash", customerRestaurant({}), customerSession({ info: { id: 1, type: 1 }, payment: { money: { total: 1, }, } }, { info: { name: 1, }, avatar: 1, }), async (req, res) => {
    const { restaurant, session, user } = res.locals as Locals;


    const newRequest: WaiterRequest = {
        _id: id(),
        active: true,
        reason: "cash",
        requestedTime: Date.now(),
    };


    const update = await updateSession(restaurant._id, { _id: session._id }, { $push: { waiterRequests: newRequest } }, { projection: { _id: 1, } });


    const request = {
        _id: newRequest._id,
        reason: "cash",
        active: true,
    }

    res.send({ updated: update.ok == 1, request });


    let username = user ? `${user?.info?.name?.first} ${user.info?.name?.last}` : "Anonymous customer";

    sendToWaiterWaiterRequest(restaurant._id, session.info.location, {
        _id: newRequest._id,
        sessionId: session._id,
        customer: { name: username, avatar: user?.avatar?.buffer },
        requestedTime: getDelay(newRequest.requestedTime),
        self: false,
        total: session.payment?.money?.total || null!,
        reason: "cash",
        sessionType: session.info.type,
        sessionIdNumber: session.info.id,

        ui: {
            acceptButtonText: "Accept",
            cancelButtonText: "Cancel",
            resolveButtonText: request.reason == "cash" ? `Collected $${session.payment?.money?.total! / 100}` : "Resolved",
            acceptedTitle: request.reason == "cash" ? `Customer has to pay $${session.payment?.money?.total! / 100}` : null!,
            reasonTitle: "Collect cash & confirm order",
            typeTitle: session.info.type == "dinein" ? "Table" : "Order",
            idTitle: "#" + session.info.id,
        }
    });
});
router.put("/request/cancel", customerRestaurant({}), customerSession({ waiterRequests: 1, }, {}), async (req, res) => {
    const { restaurant, session } = res.locals as Locals;
    const { requestId } = req.body;

    if (!requestId) {
        return res.status(400).send({ reason: "RequestIdNotProvided" });
    }

    if (!session.waiterRequests || session.waiterRequests.length == 0) {
        return res.status(400).send({ reason: "NoWaiterRequests" });
    }


    let request: WaiterRequest = null!;

    for (let r of session.waiterRequests) {
        if (r._id.equals(requestId) && r.active) {
            request = r;
            break;
        } else if (r._id.equals(requestId)) {
            return res.status(400).send({ reason: "RequestInactive" });
        }
    }

    if (!request) {
        return res.status(404).send({ reason: "RequestNotFound" });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id, },
        {
            $set: {
                "waiterRequests.$[request].active": false,
                "waiterRequests.$[request].canceledTime": Date.now(),
            }
        },
        { arrayFilters: [{ "request._id": request._id }], projection: { _id: 1 } },
    );

    res.send({ updated: update.ok == 1 });


    sendToWaiterCancelWaiterRequest(restaurant._id, session.info.location, { sessionId: session._id, requestId: request._id });
});




export {
    router as SessionRouter
}





async function calculateAmount(restaurantId: ObjectId, ds: SessionDish[], tip: number = 0, serviceFee?: { amount: number; type: 1 | 2 }) {
    const dishesId: ObjectId[] = [];


    for (let dish of ds) {
        dishesId.push(dish.dishId);
    }

    const dishes = await getDishes(restaurantId, { _id: { $in: dishesId } }, { projection: { info: { price: 1, name: 1, }, } }).toArray();


    const findDish = (dishId: ObjectId) => {
        for (let dish of dishes) {
            if (dish._id.equals(dishId)) {
                return dish;
            }
        }
        return null!;
    }

    let subtotal = 0;

    const map = new Map<string, { name: string; amount: number; price: number; }>();

    for (let d of ds) {
        const dish = findDish(d.dishId);

        if (!dish) {
            return null;
        }

        if (map.has(dish._id.toString())) {
            const entry = map.get(dish._id.toString())!;

            map.set(dish._id.toString(), { ...entry, price: entry.price + dish.info.price, amount: entry.amount + 1 });
        } else {
            map.set(dish._id.toString(), { name: dish.info.name, price: dish.info.price, amount: 1 });
        }



        subtotal += dish.info.price;
    }

    const hst = subtotal * 0.13;
    const service = serviceFee ? serviceFee?.type == 1 ? serviceFee.amount : subtotal * serviceFee.amount / 100 : null!;
    const total = hst + subtotal + (service || 0) + tip;

    return {
        money: {
            subtotal: +subtotal.toFixed(2),
            hst: +hst.toFixed(2),
            total: +total.toFixed(2),
            service: +service.toFixed(2),
            tip: +Math.floor(tip),
        },
        dishes: Array.from(map.values()),
    };
}

async function createPaymentIntent(data: {
    stripeCustomerId?: string;
    stripeAccountId: string;
    restaurantId: string;
    sessionId: string;
    total: number;
    pid?: string;
}) {
    const { pid, total, stripeAccountId, stripeCustomerId, sessionId, restaurantId } = data;
    if (pid) {

        try {
            const paymentIntent = await stripe.paymentIntents.update(pid, { amount: Math.floor(total) });

            return paymentIntent;
        } catch (e: any) {
            console.error("at session.ts createPaymentIntent() update");
            throw e;
        }

    } else {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.floor(total),
                on_behalf_of: stripeAccountId,
                currency: "cad",
                customer: stripeCustomerId || undefined,
                transfer_data: {
                    destination: stripeAccountId,
                },
                metadata: {
                    sessionId,
                    restaurantId
                }
            });



            return paymentIntent;
        } catch (e) {
            console.error("at session.ts createPaymentIntent() create");
            throw e;
        }
    }
}
