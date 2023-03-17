import { Router } from "express";
import { ObjectId } from "mongodb";
import { Dish } from "../../models/dish.js";
import { Locals } from "../../models/general.js";
import { Time } from "../../models/other/time.js";
import { SessionDish, SessionPayment } from "../../models/session.js";
import { getDishes } from "../../utils/dishes.js";
import { id } from "../../utils/id.js";
import { logged } from "../../utils/middleware/auth.js";
import { restaurantWorker } from "../../utils/middleware/restaurant.js";
import { getOrder, getOrders } from "../../utils/orders.js";
import { convertTime, getDelay, getRelativeDelay } from "../../utils/time.js";
import { getUser, getUsers } from "../../utils/users.js";



const router = Router({ mergeParams: true });



interface Order {
    status: string;
    _id: ObjectId;
    total: number;
    date: string;
    type: string;
    id: string;
    customer: { name: string; avatar: string; staff: boolean; };
}
router.get("/", logged(), restaurantWorker({ locations: 1, }, { customers: { available: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;


    if (!restaurant.locations) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    const orders = await getOrders(restaurant._id, {}, { sort: { "timing.ordered": -1 }, limit: 10, projection: { _id: 1, customer: 1, timing: 1, info: 1, status: 1, payment: { money: 1 } } }).toArray();

    const result: Order[] = [];


    const getMap = async () => {
        const usersIds: ObjectId[] = [];
        for (let order of orders) {
            usersIds.push(order.customer.customerId || order.customer.onBehalf!);
        }

        const users = await getUsers({ _id: { $in: usersIds } }, { projection: { info: { name: 1 }, avatar: { buffer: 1 } } }).toArray();

        const userMap = new Map<string, { name: string; avatar: any; }>();

        for (let user of users) {
            userMap.set(user._id.toString(), {
                name: `${user.info?.name?.first} ${user.info?.name?.last}`,
                avatar: user.avatar?.buffer,
            });
        }

        userMap.set("noid", {
            name: "Anonymous customer",
            avatar: null!,
        });

        return { userMap };
    }
    const getLocationName = (lid: ObjectId) => {
        for (let l of restaurant.locations!) {
            if (lid.equals(l._id)) {
                return l.name;
            }
        }
        return null!;
    }


    const { userMap } = await getMap();

    for (let order of orders) {
        const o: Order = {
            customer: {
                ...userMap.get((order.customer.customerId || order.customer.onBehalf || "noid")!.toString())!,
                staff: !!order.customer.onBehalf,
            },
            date: convertTime(order.timing.ordered, { day: "2-digit", hour: "numeric", month: "short" }),
            total: order.payment?.money?.total!,
            _id: order._id,
            status: order.status,
            type: order.info.type,
            id: order.info.id,
        };

        result.push(o);
    }


    res.send(result);
});


interface ConvertedOrder {
    customer: { name: string; };
    type: string;
    id: string;
    _id: ObjectId;
    location: string;
    money: SessionPayment["money"];
    method: SessionPayment["method"];
    date: string;
    status: string;
    dishes: {
        image: string;
        name: string;
        price: number;
        modifiers: number;
        staff: {
            waiter: { name: string; };
            cook: { name: string; };
        }
    }[];
}
router.get("/:orderId", logged(), restaurantWorker({ locations: { _id: 1, name: 1, } }, { customers: { available: true } }), async (req, res) => {
    const { orderId } = req.params;
    const { restaurant } = res.locals as Locals;


    if (orderId.length != 24) {
        return res.status(400).send({ reason: "InvalidOrderId" });
    }

    if (!restaurant.locations) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const order = await getOrder(restaurant._id, { _id: id(orderId) }, {});

    if (!order) {
        return res.status(404).send({ reason: "OrderNotFound" });
    }

    const userIds: ObjectId[] = [];
    const dishesIds: ObjectId[] = [];

    const getIds = () => {
        userIds.push(order.customer.customerId!, order.customer.onBehalf!);
        for (const dish of order.dishes) {
            dishesIds.push(dish.dishId);
            userIds.push(dish.staff?.cook!, dish.staff?.waiter!);
        }
    }
    //    \/
    const getDataFromDB = () => {
        getIds();

        return Promise.all([
            getUsers({ _id: { $in: userIds } }, { projection: { info: { name: 1, }, avatar: { buffer: 1 } } }).toArray(),
            getDishes(restaurant._id, { _id: { $in: dishesIds } }, { projection: { info: { name: 1, }, library: { preview: 1 } } }).toArray(),
        ]);
    }
    //    \/
    const getMaps = async () => {
        const [users, dishes] = await getDataFromDB();

        const usersMap = new Map<string, { name: string; }>();
        for (const user of users) {
            usersMap.set(user._id.toString(), { name: `${user.info?.name?.first} ${user.info?.name?.last}` });
        }
        const dishesMap = new Map<string, { name: string; price: number; image: any; }>();
        for (const dish of dishes) {
            dishesMap.set(dish._id.toString(), { name: dish.info.name, price: dish.info.price, image: dish.library?.preview! });
        }

        return { usersMap, dishesMap };
    }

    const getLocationName = () => {
        for (const location of restaurant.locations!) {
            if (location._id.equals(order.info.location)) {
                return location.name;
            }
        }
        return null!;
    }

    const convertDishes = () => {
        const result: ConvertedOrder["dishes"] = [];
        for (const dish of order.dishes) {
            const d = dishesMap.get(dish.dishId.toString()) || { name: dish.info.name!, price: dish.info.price!, image: null!, };

            result.push({
                name: d.name,
                price: dish.info.price!,
                image: d.image!,
                modifiers: dish.modifiers?.length!,
                staff: {
                    waiter: usersMap.get(dish.staff?.waiter?.toString()!)!,
                    cook: usersMap.get(dish.staff?.cook?.toString()!)!,
                }
            });
        }
        return result;
    }

    const { dishesMap, usersMap } = await getMaps();

    // get ids
    // get from db
    // convert to maps
    // convert to converted dishes



    const convertedOrder: ConvertedOrder = {
        customer: usersMap.get(order.customer.customerId?.toString() || order.customer.onBehalf?.toString()!)!,
        type: order.info.type,
        id: order.info.id,
        _id: order._id,
        money: order.payment?.money,
        method: order.payment?.method,
        date: convertTime(order.timing.ordered, { hour: "2-digit", minute: "2-digit", month: "short", day: "2-digit" }),
        dishes: convertDishes(),
        status: order.status,
        location: getLocationName(),
    }



    res.send({ order: convertedOrder });
});

router.get("/:orderId/timeline", logged(), restaurantWorker({ collections: 1 }, { customers: { available: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { orderId } = req.params;

    if (orderId.length != 24) {
        return res.status(400).send({ reason: "InvalidOrderId" });
    }

    if(!restaurant.collections) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const order = await getOrder(restaurant._id, { _id: id(orderId) }, { projection: { timeline: 1, dishes: { _id: 1, dishId: 1, } } });


    console.log(order);

    if (!order) {
        return res.status(404).send({ reason: "OrderNotFound" });
    }

    if (!order.timeline) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getCollectionsMap = (ids: ObjectId[]) => {
        const result = new Map<string, { name: string; }>();
        for(const id of ids) {
            for(const colleciton of restaurant.collections) {
                if(colleciton._id.equals(id)) {
                    result.set(id.toString(), { name: colleciton.name });
                    break;
                }
            }
        }
        return result;
    }
    const getMaps = async () => {
        const dishIds = [];
        const collectionIds = [];
        for(const component of order.timeline) {
            if(component.dishId) {
                dishIds.push(component.dishId);
            } else if(component.collectionId) {
                collectionIds.push(component.collectionId);
            } else if(component.sessionDishId) {
                for(const dish of order.dishes) {
                    if(dish._id.equals(component.sessionDishId)) {
                        dishIds.push(dish.dishId);
                        component.dishId = dish.dishId;
                        break;
                    }
                }
            }
        }

        const dishes = await getDishes(restaurant._id, { _id: { $in: dishIds } }, { projection: { info: { name: 1 } } }).toArray();

        const dishMap = new Map<string, { name: string }>();

        for(const dish of dishes) {
            dishMap.set(dish._id.toString(), { name: dish.info.name });
        }

        const collectionMap = getCollectionsMap(collectionIds);

        return { dishMap, collectionMap };
    }


    const result: {
        description: string;
        time: string;
        color: string;
    }[] = [];

    const { dishMap, collectionMap } = await getMaps();

    for (const component of order.timeline) {

        const timef = Intl.DateTimeFormat("en", { hour: "numeric", minute: "numeric" });

        switch (component.action) {
            case "comment":
                result.push({ description: "Comment added to the order", color: "gray", time: timef.format(component.time) });
                break;
            case "dish/add":
                result.push({ description: `Dish (${dishMap.get(component.dishId?.toString()!)?.name}) added`, color: "green", time: timef.format(component.time) });
                break;
            case "dish/remove":
                result.push({ description: `Dish (${dishMap.get(component.dishId?.toString()!)?.name}) removed`, color: "red", time: timef.format(component.time) });
                break;
            case "dish/comment":
                result.push({ description: `Comment of a dish (${dishMap.get(component.dishId?.toString()!)?.name}) changed`, color: "gray", time: timef.format(component.time) });
                break;
            case "dish/modifiers":
                result.push({ description: `Modifiers of a dish (${dishMap.get(component.dishId?.toString()!)?.name}) changed`, color: "gray", time: timef.format(component.time) });
                break;
            case "type":
                result.push({ description: "Order type changed", color: "gray", time: timef.format(component.time) });
                break;
            case "id":
                result.push({ description: "Order table changed", color: "gray", time: timef.format(component.time) });
                break;
            case "payed":
                result.push({ description: "Order was successfuly payed", color: "green", time: timef.format(component.time) });
                break;
            case "tip/add":
                result.push({ description: `Tip ($${component.amount! / 100}) was added`, color: "green", time: timef.format(component.time) });
                break;
            case "tip/remove":
                result.push({ description: "Tip was removed", time: timef.format(component.time), color: "red", });
                break;
            case "waiterRequest/create":
                result.push({ description: "Waiter was requested", color: "orange", time: timef.format(component.time) });
                break;
            case "waiterRequest/cancel":
                result.push({ description: "Waiter request was canceled", color: "gray", time: timef.format(component.time) });
                break;
            case "page":
                if(component.page == "collection") {
                    result.push({ description: `Collection (${collectionMap.get(component.collectionId!.toString())?.name}) page was visited`, color: "gray", time: timef.format(component.time) });
                } else if(component.page == "dish") {
                    result.push({ description: `Dish (${dishMap.get(component.dishId!.toString())?.name}) page was visited`, color: "gray", time: timef.format(component.time) });
                }
                break;
        }
    }


    res.send({ timeline: result.reverse() });
});






export {
    router as OrdersRouter,
}