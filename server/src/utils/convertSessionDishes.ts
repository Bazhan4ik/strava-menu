import { ObjectId } from "mongodb";
import { getDecorators } from "typescript";
import { Dish } from "../models/dish.js";
import { ConvertedSessionDish } from "../models/other/convertedSession.js";
import { Time } from "../models/other/time.js";
import { Session, SessionDish, SessionDishStatus } from "../models/session.js";
import { getDish, getDishes } from "./dishes.js";
import { getDelay } from "./time.js";
import { getUsers } from "./users.js";




async function convertSessionDishes(data: {
    restaurantId: ObjectId;
    sessionId: ObjectId;
    sessionDishes: SessionDish[];
    customerId: ObjectId;
    ordered: Time;
    comment?: string;
    skip: SessionDishStatus[];
}) {
    const { sessionDishes, comment: orderComment, sessionId, customerId, restaurantId, ordered, skip } = data;

    const getIds = () => {
        const dishIds = [];
        const userIds = [customerId];
        for(let i of sessionDishes) {
            dishIds.push(i.dishId);
            userIds.push(i.staff?.cook!, i.staff?.waiter!);
        }
        return { dishIds, userIds };
    }

    const { dishIds, userIds } = getIds();

    const [dishes, users] = await Promise.all([
        getDishes(restaurantId, { _id: { $in: dishIds } }, { projection: { _id: 1, info: { name: 1, }, library: { preview: 1 } } }).toArray(),
        getUsers({ _id: { $in: userIds } }, { projection: { info: { name: 1 }, avatar: 1 } }).toArray()
    ])
    


    const convertToMap = () => {
        const dishesMap = new Map<string, Dish>();

        for(let d of dishes) {
            dishesMap.set(d._id.toString(), d);
        }

        const usersMap = new Map<string, { name: string; avatar: any; }>();

        for(let user of users) {
            usersMap.set(user._id.toString(), { name: `${user.info?.name?.first} ${user.info?.name?.last}`, avatar: user.avatar?.buffer });
        }

        usersMap.set("noid", { name: `Anonymous`, avatar: null! });


        return { usersMap, dishesMap };
    }

    const { usersMap, dishesMap } = convertToMap();

    const customer = usersMap.get(customerId.toString());

    const result: ConvertedSessionDish[] = [];

    for(let sessionDish of sessionDishes) {

        if(skip.includes(sessionDish.status)) {
            continue;
        }

        const dish = dishesMap.get(sessionDish.dishId.toString());

        if(!dish) {
            return null!;
        }

        result.push({
            _id: sessionDish._id,
            dishId: sessionDish.dishId,
            sessionId: sessionId,
            comment: sessionDish.info.comment,
            orderComment: orderComment!, 
            id: sessionDish.info.id!,
            status: sessionDish.status,
            
            people: {
                customer: customer! || { name: "Deleted user", avatar: null },
                cook: usersMap.get(sessionDish.staff?.cook?.toString()!),
                waiter: usersMap.get(sessionDish.staff?.waiter?.toString()!),
            },
            
            dish: {
                name: dish.info.name,
                image: dish.library.preview,
            },
            
            time: {                
                ordered,
            }
        });
    }


    return result;
}



async function convertMultipleSessionsSessionDishes(restaurantId: ObjectId, sessions: Session[], skipStatuses: SessionDishStatus[]) {
    
    const getIds = () => {
        const dishIds: ObjectId[] = [];
        const userIds: ObjectId[] = [];

        for(let session of sessions) {

            if(session.customer.customerId) {
                userIds.push(session.customer.customerId);
            }

            for(let dish of session.dishes) {
                dishIds.push(dish.dishId);

                if(dish.staff?.cook) {
                    userIds.push(dish.staff.cook);
                }
                // if(dish.staff?.waiter) {
                //     userIds.push(dish.staff.waiter);
                // }
            }
        }

        return { dishIds, userIds };
    };

    const { userIds, dishIds } = getIds();

    const dishes = await getDishes(restaurantId, { _id: { $in: dishIds } }, { projection: { info: { name: 1 }, library: { preview: 1 } } }).toArray();
    const users = await getUsers({ _id: { $in: userIds } }, { projection: { info: { name: 1 }, avatar: 1 } }).toArray();

    const convertToMap = () => {
        const dishesMap = new Map<string, { name: string; image: any; }>();

        for(let dish of dishes) {
            dishesMap.set(dish._id.toString(), { name: dish.info.name, image: dish.library.preview });
        }

        const usersMap = new Map<string, { name: string; avatar: any; }>();

        for(let user of users) {
            usersMap.set(user._id.toString(), { name: `${user.info?.name?.first} ${user.info?.name?.last}`, avatar: user.avatar?.buffer });
        }

        usersMap.set("noid", { name: `Anonymous`, avatar: null! });


        return { dishesMap, usersMap };
    }

    const { dishesMap, usersMap } = convertToMap();


    const result: ConvertedSessionDish[] = [];

    for(let session of sessions) {

        
        const customer = usersMap.get(session.customer.customerId?.toString() || "noid")!;
        
        for(let dish of session.dishes) {
            
            if(skipStatuses.includes(dish.status)) {
                continue;
            }

            const d = dishesMap.get(dish.dishId.toString());

            if(!d) {
                return null!;
            }

            result.push({
                _id: dish._id,
                dishId: dish.dishId,
                sessionId: session._id,
                comment: dish.info.comment,
                id: dish.info.id!,
                status: dish.status,
                orderComment: session.info.comment!,

                dish: d!,

                time: {
                    ordered: getDelay(session.timing.ordered),
                    taken: getDelay(dish.timing?.taken),
                    cooked: getDelay(dish.timing?.cooked),
                },
                
                people: {
                    customer: customer,
                    cook: dish.staff?.cook ? usersMap.get(dish.staff?.cook.toString()) : null!,
                    waiter: dish.staff?.waiter ? usersMap.get(dish.staff?.waiter.toString()) : null!,
                },
            });
        }
    }


    return result;
}


async function convertOneSessionDish(data: {
    restaurantId: ObjectId;
    sessionDish: SessionDish;
    ordered: number;
    sessionId: ObjectId;
    customerId: ObjectId;
    comment?: string;
}) {
    let { ordered, sessionId, customerId, restaurantId, comment: orderComment, sessionDish } = data;


    const users = await getUsers({ _id: { $in: [customerId, sessionDish.staff?.cook!, sessionDish.staff?.waiter!] } }, { projection: { info: { name: 1 }, avatar: 1 } }).toArray();

    const convertToMap = () => {
        const usersMap = new Map<string, { name: string; avatar: any; }>();

        for(let user of users) {
            usersMap.set(user._id.toString(), { name: `${user.info?.name?.first} ${user.info?.name?.last}`, avatar: user.avatar?.buffer });
        }

        usersMap.set("noid", { name: `Anonymous`, avatar: null! });


        return usersMap;
    }

    const people = convertToMap();


    const dish = await getDish(restaurantId, { _id: sessionDish.dishId }, { projection: { info: { name: 1 }, library: { preview: 1 } } });

    if(!dish) {
        return null;
    }

    const result: ConvertedSessionDish = {
        _id: sessionDish._id,
        sessionId: sessionId,
        dishId: sessionDish.dishId,
        status: sessionDish.status,
        comment: sessionDish.info.comment,
        id: sessionDish.info.id!,
        orderComment: orderComment!,
        
        time: {
            ordered: getDelay(ordered),
            cooked: getDelay(sessionDish.timing?.cooked),
            taken: getDelay(sessionDish.timing?.taken),
        },


        people: {
            cook: people.get(sessionDish.staff?.cook?.toString()!),
            waiter: people.get(sessionDish.staff?.waiter?.toString()!),
            customer: people.get(customerId.toString())!,
        },

        dish: {
            name: dish?.info.name,
            image: dish.library.preview,
        },
    };

    return result;
}


export {
    convertSessionDishes,
    convertMultipleSessionsSessionDishes,
    convertOneSessionDish,
}