import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { logged } from "../../middleware/auth.js";
import { restaurantWorker } from "../../middleware/restaurant.js";
import { getOrders } from "../../utils/data/orders.js";
import { convertTime, TIME } from "../../utils/other/time.js";
import { getUsers } from "../../utils/data/users.js";




const router = Router({ mergeParams: true });




interface Customer {
    name: string;
    avatar: string;
    orders: number;
    total: number;
    date: string;
    _id: ObjectId;
}
router.get("/", logged(), restaurantWorker({ customers: 1, }, { customers: { available: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;

    if(!restaurant.customers) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    const getIds = () => {
        const users = [];
        const orders = [];
        for(let user of restaurant.customers!.slice(0, 10)) {
            users.push(user.userId);
            orders.push(...user.orders);
        }
        return { userIds: users, orderIds: orders };
    }
    const getMap = () => {
        const result = new Map<string, { name: string; avatar: any; total: number; }>();
        for(let user of users) {
            let total = 0;
            for(let order of orders) {
                if(order.customer.customerId?.equals(user._id)) {
                    total += order.payment?.money?.total!;
                }
            }
            result.set(user._id.toString(), { name: `${user.info?.name?.first} ${user.info?.name?.last}`, avatar: user.avatar?.buffer, total });
        }
        return result;
    }

    const { userIds, orderIds } = getIds();

    const [users, orders] = await Promise.all([
        await getUsers({ _id: { $in: userIds } }, { projection: { info: { name: 1, }, avatar: 1 } }).toArray(),
        await getOrders(restaurant._id, { _id: { $in: orderIds } }, { projection: { customer: { customerId: 1 }, payment: { money: { total: 1 } } } }).toArray(),
    ]);

    const map = getMap();



    const result: Customer[] = [];


    for(let customer of restaurant.customers.slice(0, 10)) {
        const user = map.get(customer.userId.toString());
        if(!user) {
            continue;
        }

        const converted: Customer = {
            name: user.name,
            avatar: user.avatar,
            orders: customer.orders.length,
            date: convertTime(customer.last, TIME.dayMonth),
            _id: customer.userId,
            total: user.total,
        };

        result.push(converted);
    }



    

    res.send(result);
});




export {
    router as CustomersRouter,
}