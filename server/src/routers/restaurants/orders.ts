import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { Time } from "../../models/other/time.js";
import { getDishes } from "../../utils/dishes.js";
import { logged } from "../../utils/middleware/auth.js";
import { restaurantWorker } from "../../utils/middleware/restaurant.js";
import { getOrders } from "../../utils/orders.js";
import { convertTime, getDelay, getRelativeDelay } from "../../utils/time.js";
import { getUsers } from "../../utils/users.js";



const router = Router({ mergeParams: true });



interface Order {
    status: string;
    _id: ObjectId;
    total: number;
    dishesAmount: number;
    date: string;
    location: string;

    customer: { name: string; avatar: string; staff: boolean; };
    dishes: {
        name: string;
        price: number;
        image: any;
        status: string;
        cook: { name: string; };
        waiter: { name: string; };
        time: Time;
    }[];
}

router.get("/", logged(), restaurantWorker({ locations: 1, }, { customers: { available: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;


    if(!restaurant.locations) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    const orders = await getOrders(restaurant._id, { }, { limit: 10 }).toArray();


    const result: Order[] = [];


    const getMaps = async () => {
        const dishesIds: ObjectId[] = [];
        const usersIds: ObjectId[] = [];
        for(let order of orders) {
            usersIds.push(order.customer.customerId || order.customer.onBehalf!);
            for(let dish of order.dishes.slice(0, 2)) {
                dishesIds.push(dish.dishId);
                usersIds.push(dish.staff?.cook!, dish.staff?.waiter!);
            }
        }

        const [users, dishes] = await Promise.all([
            await getUsers({ _id: { $in: usersIds } }, { projection: { info: { name: 1 }, avatar: { buffer: 1 } } }).toArray(),
            await getDishes(restaurant._id, { _id: { $in: dishesIds } }, { projection: { info: { name: 1, price: 1 }, library: { preview: 1 } } }).toArray(),
        ]);

        const dishMap = new Map<string, { name: string; price: number; image: any; }>();
        const userMap = new Map<string, { name: string; avatar: any; }>();

        for(let user of users) {
            userMap.set(user._id.toString(), {
                name: `${user.info?.name?.first} ${user.info?.name?.last}`,
                avatar: user.avatar?.buffer,
            });
        }
        for(let dish of dishes) {
            dishMap.set(dish._id.toString(), {
                name: dish.info.name,
                price: dish.info.price,
                image: dish.library.preview,
            });
        }

        return { dishMap, userMap };
    }
    const getLocationName = (lid: ObjectId) => {
        for(let l of restaurant.locations!) {
            if(lid.equals(l._id)) {
                return l.name;
            }
        }
        return null!;
    }


    const { dishMap, userMap } = await getMaps();

    for(let order of orders) {
        const o: Order = {
            customer: {
                ...userMap.get((order.customer.customerId || order.customer.onBehalf)!.toString())!,
                staff: !!order.customer.onBehalf,
            },
            date: convertTime(order.timing.ordered, { day: "2-digit", hour: "numeric", month: "short" }),
            location: getLocationName(order.info.location),
            total: order.payment?.money?.total!,
            _id: order._id,
            status: order.status,
            dishes: [],
            dishesAmount: order.dishes.length,
        };

        for(let dish of order.dishes.slice(0, 2)) {
            const d = dishMap.get(dish.dishId.toString());

            o.dishes.push({
                ...d!,
                cook: userMap.get(dish.staff?.cook?.toString()!)!,
                waiter: userMap.get(dish.staff?.waiter?.toString()!)!,
                status: dish.status,
                time: getRelativeDelay(order.timing.ordered!, dish.timing?.served!)!,
            });
        }

        result.push(o);
    }


    console.log(result);




    res.send(result);
});






export {
    router as OrdersRouter,
}