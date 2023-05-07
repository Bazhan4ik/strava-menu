import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { Time } from "../../models/other/time.js";
import { SessionPayment } from "../../models/session.js";
import { id } from "../../utils/other/id.js";
import { getItems } from "../../utils/data/items.js";
import { logged } from "../../middleware/auth.js";
import { restaurantWorker } from "../../middleware/restaurant.js";
import { getOrder, getOrders } from "../../utils/data/orders.js";
import { convertTime, getDelay, getRelativeDelay } from "../../utils/other/time.js";
import { getUser, getUsers } from "../../utils/data/users.js";



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
    items: {
        hasImage: boolean;
        name: string;
        price: number;
        modifiers: number;
        id: string;
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
    const itemsIds: ObjectId[] = [];

    const getIds = () => {
        userIds.push(order.customer.customerId!, order.customer.onBehalf!);
        for (const item of order.items) {
            itemsIds.push(item.itemId);
            userIds.push(item.staff?.cook!, item.staff?.waiter!);
        }
    }
    //    \/
    const getDataFromDB = () => {
        getIds();

        return Promise.all([
            getUsers({ _id: { $in: userIds } }, { projection: { info: { name: 1, }, avatar: { buffer: 1 } } }).toArray(),
            getItems(restaurant._id, { _id: { $in: itemsIds } }, { projection: { id: 1, info: { name: 1, }, library: { userId: 1, } } }).toArray(),
        ]);
    }
    //    \/
    const getMaps = async () => {
        const [users, items] = await getDataFromDB();

        const usersMap = new Map<string, { name: string; }>();
        for (const user of users) {
            usersMap.set(user._id.toString(), { name: `${user.info?.name?.first} ${user.info?.name?.last}` });
        }
        const itemsMap = new Map<string, { name: string; id: string; hasImage: boolean; price: number; }>();
        for (const item of items) {
            itemsMap.set(item._id.toString(), { name: item.info.name, id: item.id, price: item.info.price, hasImage: !!item.library?.userId! });
        }

        return { usersMap, itemsMap };
    }

    const getLocationName = () => {
        for (const location of restaurant.locations!) {
            if (location._id.equals(order.info.location)) {
                return location.name;
            }
        }
        return null!;
    }

    const convertItems = () => {
        const result: ConvertedOrder["items"] = [];
        for (const item of order.items) {
            const d = itemsMap.get(item.itemId.toString()) || { name: item.info.name!, id: null!, price: item.info.price!, hasImage: false, };

            result.push({
                name: d.name,
                price: item.info.price!,
                hasImage: d.hasImage,
                id: d.id,
                modifiers: item.modifiers?.length!,
                staff: {
                    waiter: usersMap.get(item.staff?.waiter?.toString()!)!,
                    cook: usersMap.get(item.staff?.cook?.toString()!)!,
                }
            });
        }
        return result;
    }

    const { itemsMap, usersMap } = await getMaps();

    // get ids
    // get from db
    // convert to maps
    // convert to converted items



    const convertedOrder: ConvertedOrder = {
        customer: usersMap.get(order.customer.customerId?.toString() || order.customer.onBehalf?.toString()!)!,
        type: order.info.type,
        id: order.info.id,
        _id: order._id,
        money: order.payment?.money,
        method: order.payment?.method,
        date: convertTime(order.timing.ordered, { hour: "2-digit", minute: "2-digit", month: "short", day: "2-digit" }),
        items: convertItems(),
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

    const order = await getOrder(restaurant._id, { _id: id(orderId) }, { projection: { timeline: 1, items: { _id: 1, itemId: 1, } } });


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
        const itemsIds = [];
        const collectionIds = [];
        for(const component of order.timeline) {
            if(component.itemId) {
                itemsIds.push(component.itemId);
            } else if(component.collectionId) {
                collectionIds.push(component.collectionId);
            } else if(component.sessionItemId) {
                for(const item of order.items) {
                    if(item._id.equals(component.sessionItemId)) {
                        itemsIds.push(item.itemId);
                        component.itemId = item.itemId;
                        break;
                    }
                }
            }
        }

        const items = await getItems(restaurant._id, { _id: { $in: itemsIds } }, { projection: { info: { name: 1 } } }).toArray();

        const itemsMap = new Map<string, { name: string }>();

        for(const item of items) {
            itemsMap.set(item._id.toString(), { name: item.info.name });
        }

        const collectionMap = getCollectionsMap(collectionIds);

        return { itemsMap, collectionMap };
    }


    const result: {
        description: string;
        time: string;
        color: string;
    }[] = [];

    const { itemsMap, collectionMap } = await getMaps();

    for (const component of order.timeline) {

        const timef = Intl.DateTimeFormat("en", { hour: "numeric", minute: "numeric" });

        switch (component.action) {
            case "comment":
                result.push({ description: "Comment added to the order", color: "gray", time: timef.format(component.time) });
                break;
            case "item/add":
                result.push({ description: `Item (${itemsMap.get(component.itemId?.toString()!)?.name}) added`, color: "green", time: timef.format(component.time) });
                break;
            case "item/remove":
                result.push({ description: `Item (${itemsMap.get(component.itemId?.toString()!)?.name}) removed`, color: "red", time: timef.format(component.time) });
                break;
            case "item/comment":
                result.push({ description: `Comment of an item (${itemsMap.get(component.itemId?.toString()!)?.name}) changed`, color: "gray", time: timef.format(component.time) });
                break;
            case "item/modifiers":
                result.push({ description: `Modifiers of an item (${itemsMap.get(component.itemId?.toString()!)?.name}) changed`, color: "gray", time: timef.format(component.time) });
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
                } else if(component.page == "item") {
                    result.push({ description: `Item (${itemsMap.get(component.itemId!.toString())?.name}) page was visited`, color: "gray", time: timef.format(component.time) });
                }
                break;
        }
    }


    res.send({ timeline: result.reverse() });
});






export {
    router as OrdersRouter,
}