import { ObjectId } from "mongodb";
import { Item } from "../models/item.js";
import { ConvertedSessionItem } from "../models/other/convertedSession.js";
import { Time } from "../models/other/time.js";
import { Session, SessionItem, SessionItemStatus } from "../models/session.js";
import { getItem, getItems } from "./data/items.js";
import { getDelay } from "./other/time.js";
import { getUsers } from "./data/users.js";




async function convertSessionItems(data: {
    sessionItems: SessionItem[];
    skip: SessionItemStatus[];
    restaurantId: ObjectId;
    customerId: ObjectId;
    deliveryTime: number;
    sessionId: ObjectId;
    comment?: string;
    ordered: Time;
    type: string;
    id: string;
}) {
    const { sessionItems, type, deliveryTime, id, comment: orderComment, sessionId, customerId, restaurantId, ordered, skip } = data;

    const getIds = () => {
        const itemIds = [];
        const userIds = [customerId];
        for(let i of sessionItems) {
            itemIds.push(i.itemId);
            userIds.push(i.staff?.cook!, i.staff?.waiter!);
        }
        return { itemIds, userIds };
    }

    const { itemIds, userIds } = getIds();

    const [items, users] = await Promise.all([
        getItems(restaurantId, { _id: { $in: itemIds } }, { projection: { _id: 1, info: { name: 1, averageTime: 1, }, library: { preview: 1 } } }).toArray(),
        getUsers({ _id: { $in: userIds } }, { projection: { info: { name: 1 }, avatar: 1 } }).toArray()
    ])
    


    const convertToMap = () => {
        const itemsMap = new Map<string, Item>();

        for(let d of items) {
            itemsMap.set(d._id.toString(), d);
        }

        const usersMap = new Map<string, { name: string; avatar: any; _id: ObjectId; }>();

        for(let user of users) {
            let username = user ? `${user.info?.name?.first} ${user.info?.name?.last}` : "Anonymous customer";
            usersMap.set(user._id.toString(), { name: username, _id: user._id, avatar: user.avatar?.buffer });
        }

        usersMap.set("noid", { name: `Anonymous`, avatar: null!, _id: null!, });


        return { usersMap, itemsMap };
    }

    const { usersMap, itemsMap } = convertToMap();

    const customer = usersMap.get((customerId || "noid").toString());

    const result: ConvertedSessionItem[] = [];

    for(let sessionItem of sessionItems) {

        if(skip.includes(sessionItem.status)) {
            continue;
        }

        const item = itemsMap.get(sessionItem.itemId.toString());

        if(!item) {
            return null!;
        }


        result.push({
            _id: sessionItem._id,
            itemId: sessionItem.itemId,
            sessionId: sessionId,
            comment: sessionItem.info.comment,
            orderComment: orderComment!, 
            id: sessionItem.info.id!,
            status: sessionItem.status,

            order: {
                type,
                id,
            },
            
            people: {
                customer: customer! || { name: "Deleted user", avatar: null },
                cook: usersMap.get(sessionItem.staff?.cook?.toString()!),
                waiter: usersMap.get(sessionItem.staff?.waiter?.toString()!),
            },
            
            item: {
                name: item.info.name,
                image: item.library?.preview,
            },
            
            time: {                
                ordered,
                averageCooking: item.info.averageTime,
                beReady: type == "delivery" ? new Date(deliveryTime).getTime() : undefined!,
            }
        });
    }


    return result;
}



/**
 * 
 * This function should convert dishes of the provided sessions.
 * This function should sort the dishes from the most delayed one to the newest ones (newest to the end)
 * This function should sort the delivery dishes, so they are cooked before the delivery driver picks up them
 * 
 */
async function convertMultipleSessionsSessionItems(data: {
    restaurantId: ObjectId;
    sessions: Session[];
    skipStatuses: SessionItemStatus[];
}) {
    
    const { skipStatuses, sessions, restaurantId } = data;

    const getIds = () => {
        const itemIds: ObjectId[] = [];
        const userIds: ObjectId[] = [];

        for(let session of sessions) {

            if(session.customer.customerId) {
                userIds.push(session.customer?.customerId);
            }

            for(let item of session.items) {
                itemIds.push(item.itemId);

                if(item.staff?.cook) {
                    userIds.push(item.staff.cook);
                }
            }
        }

        return { itemIds, userIds };
    };

    const { userIds, itemIds } = getIds();

    const [items, users] = await Promise.all([
        getItems(restaurantId, { _id: { $in: itemIds } }, { projection: { info: { name: 1, averageTime: 1, }, library: { preview: 1 } } }).toArray(),
        getUsers({ _id: { $in: userIds } }, { projection: { info: { name: 1 }, avatar: 1 } }).toArray(),
    ]);

    const convertToMap = () => {
        const itemsMap = new Map<string, { name: string; image: any; averageCooking?: number; }>();

        

        for(let item of items) {
            itemsMap.set(item._id.toString(), { name: item.info.name, averageCooking: item.info.averageTime, image: item.library?.preview });
        }

        const usersMap = new Map<string, { name: string; avatar: any; _id: ObjectId; }>();

        for(let user of users) {
            usersMap.set(user._id.toString(), { name: `${user.info?.name?.first} ${user.info?.name?.last}`, _id: user._id, avatar: user.avatar?.buffer });
        }

        usersMap.set("noid", { name: `Anonymous customer`, avatar: null!, _id: null!, });


        return { itemsMap, usersMap };
    }

    const { itemsMap, usersMap } = convertToMap();


    const result: ConvertedSessionItem[] = [];
    for(let session of sessions) {

        
        const customer = usersMap.get(session.customer.customerId?.toString() || "noid")!;


        for(let item of session.items) {
            
            if(skipStatuses.includes(item.status)) {
                continue;
            }

            const d = itemsMap.get(item.itemId.toString());

            if(!d) {
                return null!;
            }


            result.push({
                _id: item._id,
                itemId: item.itemId,
                sessionId: session._id,
                comment: item.info.comment,
                id: item.info.id!,
                status: item.status,
                orderComment: session.info.comment!,

                item: d!,

                order: {
                    type: session.info.type,
                    id: session.info.id,
                },

                time: {
                    ordered: getDelay(session.timing.ordered),
                    taken: getDelay(item.timing?.taken),
                    cooked: getDelay(item.timing?.cooked),
                    averageCooking: d.averageCooking,
                    beReady: session.info.type == "delivery" ? new Date(session.info.delivery!.time).getTime() : undefined!,
                },
                
                people: {
                    customer: customer,
                    cook: item.staff?.cook ? usersMap.get(item.staff?.cook.toString()) : null!,
                    waiter: item.staff?.waiter ? usersMap.get(item.staff?.waiter.toString()) : null!,
                },
            });
        }
    }


    return result;
}


async function convertOneSessionItem(data: {
    sessionItem: SessionItem;
    restaurantId: ObjectId;
    customerId: ObjectId;
    sessionId: ObjectId;
    deliveryTime: any;
    comment?: string;
    ordered: number;
    type: string;
    id: string;
}) {
    const { ordered, sessionId, customerId, restaurantId, deliveryTime, comment: orderComment, sessionItem, type, id } = data;


    const users = await getUsers({ _id: { $in: [customerId, sessionItem.staff?.cook!, sessionItem.staff?.waiter!] } }, { projection: { info: { name: 1 }, avatar: 1 } }).toArray();

    const convertToMap = () => {
        const usersMap = new Map<string, { name: string; avatar: any; _id: ObjectId; }>();

        for(let user of users) {
            usersMap.set(user._id.toString(), { name: `${user.info?.name?.first} ${user.info?.name?.last}`, avatar: user.avatar?.buffer, _id: user._id });
        }

        usersMap.set("noid", { name: `Anonymous`, avatar: null!, _id: null!, });


        return usersMap;
    }

    const people = convertToMap();


    const item = await getItem(restaurantId, { _id: sessionItem.itemId }, { projection: { info: { name: 1, averageTime: 1, }, library: { preview: 1 } } });

    if(!item) {
        return null;
    }


    const result: ConvertedSessionItem = {
        _id: sessionItem._id,
        sessionId: sessionId,
        itemId: sessionItem.itemId,
        status: sessionItem.status,
        comment: sessionItem.info.comment,
        id: sessionItem.info.id!,
        orderComment: orderComment!,

        order: {
            type: type,
            id: id,
        },
        
        time: {
            ordered: getDelay(ordered),
            cooked: getDelay(sessionItem.timing?.cooked),
            taken: getDelay(sessionItem.timing?.taken),
            averageCooking: item.info.averageTime,
            beReady: type == "delivery" ? new Date(deliveryTime).getTime() : undefined,
        },


        people: {
            cook: people.get(sessionItem.staff?.cook?.toString()!),
            waiter: people.get(sessionItem.staff?.waiter?.toString()!),
            customer: people.get((customerId || "noid").toString())!,
        },

        item: {
            name: item?.info.name,
            image: item.library?.preview,
        },
    };

    return result;
}


export {
    convertSessionItems,
    convertMultipleSessionsSessionItems,
    convertOneSessionItem,
}


















