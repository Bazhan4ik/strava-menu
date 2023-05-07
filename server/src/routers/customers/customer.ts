import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { Collection } from "../../models/restaurant.js";
import { Session, TimelineComponent } from "../../models/session.js";
import { getItem, getItems } from "../../utils/data/items.js";
import { id } from "../../utils/other/id.js";
import { customerSession } from "../../middleware/customerSession.js";
import { customerRestaurant } from "../../middleware/customerRestaurant.js";
import { getSession, getSessions, updateSession } from "../../utils/data/sessions.js";
import { SessionRouter } from "./session.js";
import { aggregateRestaurant } from "../../utils/data/restaurant.js";



const projections = {
    collections: {
        goodQuality: {
            id: 1,
            _id: 1,
            info: {
                name: 1,
                price: 1,
            },
            library: { original: 1 },
        },
        badQuality: {
            id: 1,
            _id: 1,
            info: {
                name: 1,
                price: 1,
            },
            library: { blur: 1 },
        },
    },
    customerItem: {
        id: 1,
        info: {
            name: 1,
            price: 1,
            description: 1,
        },
        modifiers: 1,
    },
}




const router = Router({ mergeParams: true });


router.use("/session", SessionRouter);


router.get("/locations", customerRestaurant({ locations: 1, info: { name: 1, id: 1, } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;



    if (!restaurant.locations || restaurant.locations.length == 0) {
        return res.status(403).send({ reason: "NoLocations" });
    }

    const locations = [];

    for (let location of restaurant.locations!) {
        locations.push({
            name: location.name,
            addressLine1: location.line1,
            addressLine2: location.line2,
            city: location.city,
            id: location.id,
        });
    }


    res.send({
        locations,
        restaurant: {
            name: restaurant.info.name,
            id: restaurant.info.id
        }
    });
});

router.get("/recommendations", customerRestaurant({ _id: 1, collections: 1, sorting: 1, layout: 1, }), customerSession({}, {}), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;


    if(!restaurant.collections || !restaurant.sorting || !restaurant.layout) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const date = new Date();
    const day = date.getDay();
    const time = (() => {
        const hours = date.getHours();
        if(hours >= 17) {
            if(hours > 20) {
                return "night";
            } else {
                return "evening";
            }
        } else if(hours < 17) {
            if(hours < 12) {
                if(hours < 5) {
                    return "night";
                } else {
                    return "morning";
                }
            } else {
                return "afternoon";
            }
        }
        return null!
    })();
    
    const collectionAvailable = (id: ObjectId) => {
        let dayAvailable = false;
        let timeAvailable = false;

        for(const collection of restaurant.sorting!.days[day as 0].collections) {
            if(collection.equals(id)) {
                dayAvailable = true;
                break;
            }
        }
        for(const collection of restaurant.sorting!.times[time].collections) {
            if(collection.equals(id)) {
                timeAvailable = true;
                break;
            }
        }
        
        return dayAvailable && timeAvailable;
    }
    const itemAvailable = (id: ObjectId) => {
        let dayAvailable = false;
        let timeAvailable = false;
        
        // check if the item is available for the day and time
        for(const item of restaurant.sorting!.days[day as 0].items) {
            if(item.equals(id)) {
                dayAvailable = true;
                break;
            }
        }
        for(const item of restaurant.sorting!.times[time].items) {
            if(item.equals(id)) {
                timeAvailable = true;
                break;
            }
        }
        
        return dayAvailable && timeAvailable;
    }

    const getCollection = (id: ObjectId) => {
        if(!collectionAvailable(id)) {
            return null!;
        }
        for(const collection of restaurant.collections) {
            if(collection._id.equals(id)) {
                return collection;
            }
        }
        return null!;
    }
    const getItem = (id: ObjectId) => {
        if(!itemAvailable(id)) {
            return null!;
        }
        for(const item of items) {
            if(item._id.equals(id)) {
                if(item.status != "visible") {
                    return null!;
                }
                return item;
            }
        }
        return null!;
    }
    const filterItems = () => {
        for(let e = 0; e < result.elements.length; e++) {
            const element = result.elements[e];

            if(element.type == "collections") {

                const collections = (element.data as any as { name: string; _id: ObjectId; id: string; items: ObjectId[]; }[]);

                for(let c = 0; c < collections.length; c++) {
                    for(let d in collections[c].items) {
                        if(!getItem(collections[c].items[d])) {
                            collections[c].items.splice(+d, 1);
                        }
                    }
                    if(collections[c].items.length == 0) {
                        collections.splice(+c, 1);
                        c -= 1;
                    }
                }
                
                continue;
            } else if(element.type == "item") {
                const item = getItem((element.data as any)._id);

                if(!item) {
                    result.elements.splice(+e, 1);
                    e -= 1;
                    continue;
                }

                element.data = item as any;
                continue;
            }

            const items = (element.data as { items: ObjectId[] }).items;

            for(let d in items) {
                if(!getItem(items[d])) {
                    items.splice(+d, 1);
                }
            }

            if(items.length == 0) {
                result.elements.splice(+e, 1);
                e -= 1;
            }
        }

        return result.elements;
    }
    const getCollections = (ids: ObjectId[]) => {
        const collections: { name: string; _id: ObjectId; id: string; hasImage: boolean; items: ObjectId[]; }[] = [];

        for(const id of ids) {
            const collection = getCollection(id);

            if(!collection) {
                continue;
            }

            collections.push({
                name: collection.name,
                _id: collection._id,
                id: collection.id,
                items: collection.items,
                hasImage: !!collection.image?.userId,
            });
        }

        return collections;
    }

    const itemsIds: ObjectId[] = [];


    const result: {
        tracking?: any[],
        elements: {
            type: "collection" | "collections" | "item";
            data: {
                name: string;
                items: ObjectId[];
            } | {
                    name: string;
                    id: string;
                    _id: ObjectId;
                    hasImage: boolean;
                    items: ObjectId[];
            }[]| {
                _id: string;
                id: string;
                info: {
                    name: string;
                    description: string;
                    price: number;
                }
            }
        }[];
        items?: { [itemId: string]: any }[];
    } = {
        elements: [],
    }
    
    for(const element of restaurant.layout) {
        if(!element.data?.id && !element.data?.ids) {
            continue;
        }

        if(element.type == "collection") {
            console.log(element.data);

            const collection = getCollection(element.data.id);

            console.log(collection);
            
            if(!collection) {
                continue;
            }

            if(collection.items.length == 0) {
                continue;
            }
            
            itemsIds.push(...collection.items);

            result.elements.push({
                type: "collection",
                data: {
                    name: collection.name,
                    items: collection.items,
                },
            });
        } else if(element.type == "collections") {
            const collections = getCollections(element.data.ids);

            if(!collections) {
                continue;
            }

            if(collections.length == 0) {
                continue;
            }


            result.elements.push({
                type: "collections",
                data: collections,
            });

        } else if(element.type == "item") {
            result.elements.push({
                type: element.type,
                data: {
                    _id: element.data.id
                } as any
            });
            itemsIds.push(element.data.id);
        }
    }

    let sessions: Session[] = null!;

    if (user) {
        sessions = await getSessions(
            restaurant._id,
            { "customer.customerId": user._id, status: "progress" },
            { projection: { items: { itemId: 1, status: 1, _id: 1 } } }
        ).toArray();

        result.tracking = [];

        for (let session of sessions.slice(0, 1)) {
            for (let item of session.items.slice(0, 3)) {
                itemsIds.push(item.itemId);
            }
        }
    }

    const items = await getItems(
        restaurant._id,
        { _id: { $in: itemsIds }, status: "visible" },
        { projection: {
            id: 1,
            _id: 1,
            status: 1,
            info: {
                name: 1,
                price: 1,
                description: 1,
            },
            library: { userId: 1 },
        } }
    ).toArray();

    if(sessions) {
        for (let session of sessions) {
            for (let item of session.items.slice(0, 3)) {
                const d = getItem(item.itemId);
                result.tracking!.push({
                    status: item.status,
                    name: d?.info?.name,
                    _id: item._id,
                    itemId: item.itemId,
                    hasImage: !!d.library?.userId
                });
            }
        }
    }

    const itemMap = new Map();
    for(const item of items) {
        itemMap.set(item._id.toString(), { ...item, hasImage: !!item.library?.userId });
    }

    result.items = Object.fromEntries(itemMap.entries());

    result.elements = filterItems();

    res.send(result);
});

router.get("/items/:itemId", customerRestaurant({ collections: 1, }), customerSession({}, { }), async (req, res) => {
    const { restaurant, session } = res.locals as Locals;
    const { itemId } = req.params;
    const { c } = req.query;

    const item = await getItem(restaurant._id, { id: itemId }, { projection: projections.customerItem });

    
    if (!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }
    if(!item.modifiers) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getModifierSubtitle = (o: string, a: number) => {
        if(o == "less") {
            return `Up to ${a}`;
        } else if(o == "more") {
            return `At least ${a}`;
        } else if(o == "one") {
            return null!;
        } else if(o == "equal") {
            return `Choose ${a} options`;
        }
        return null!;
    }
    const getModifiers = () => {
        const result: {
            title: string;
            subtitle: string;

            _id: ObjectId;
            required: boolean;
            toSelect: number;
            toSelectAmount: string;
        
            options: {
                name: string;
                price: number;
                _id: ObjectId;
            }[];
        }[] = [];
        for(const modifier of item.modifiers!) {
            result.push({
                toSelect: modifier.amountOfOptions,
                toSelectAmount: modifier.amountToSelect,
                subtitle: getModifierSubtitle(modifier.amountToSelect, modifier.amountOfOptions),
                options: modifier.options,
                required: modifier.required,
                _id: modifier._id,
                title: modifier.name,
            });
        }
        return result;
    }

    const result: any = {
        item: {
            info: {
                name: item.info.name,
                price: item.info.price,
                description: item.info.description,
            },
            _id: item._id,
            id: item.id,
            modifiers: getModifiers()
        }
    }

    if (c && typeof c == "string") {
        let collection: Collection = null!;


        for (let coll of restaurant.collections) {
            if (coll.id == c) {
                collection = coll;
                break;
            }
        }

    }


    res.send(result);


    const timeline: TimelineComponent = {
        action: "page",
        time: Date.now(),
        page: "item",
        userId: "customer",
        itemId: item._id,
    };

    updateSession(restaurant._id, { _id: session._id, }, { $push: { timeline } }, { noResponse: true, });
});
router.get("/items/:itemId/image", async (req, res) => {
    const { restaurantId, itemId } = req.params as any;

    if(restaurantId.length != 24) {
        return res.sendStatus(400);
    }

    const item = await getItem(id(restaurantId), { $or: [ { _id: id(itemId) }, { id: itemId } ] }, { projection: { library: { list: { $slice: 1 } } } });

    if(item?.library?.original) {

        const buffer = item.library.original.buffer;


        res.contentType('image/jpeg');
        res.send(buffer);

        // res.writeHead(200, {
        //     'Content-Type': 'image/png',
        //     'Content-Length': buffer.length
        // });

        // res.end(buffer, "binary");

        return;
    }

    res.send(null);
});

router.get("/modifiers", customerRestaurant({ }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { sessionItemId, itemId } = req.query;

    if(typeof sessionItemId != "string" || sessionItemId.length != 24) {
        return res.status(400).send({ reason: "InvalidSessionItemId" });
    }
    if(typeof itemId != "string" || itemId.length != 24) {
        return res.status(400).send({ reason: "InvalidItemId" });
    }


    const session = await getSession(
        restaurant._id,
        { items: { $elemMatch: { _id: id(sessionItemId) } } },
        { projection: { items: { _id: 1, modifiers: 1 } } },
    );

    if(!session) {
        return res.status(404).send({ reason: "SesssionNotFound" });
    }

    const getModifierSubtitle = (o: string, a: number) => {
        if(o == "less") {
            return `Up to ${a}`;
        } else if(o == "more") {
            return `At least ${a}`;
        } else if(o == "one") {
            return null!;
        } else if(o == "equal") {
            return `Choose ${a} options`;
        }
        return null!;
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
        { projection: { modifiers: 1 } }
    );

    if(!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }
    if(!item.modifiers) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const result = [];

    for(const modifier of item.modifiers) {
        let added = false;
        for(const itemModifier of modifiers) {
            if(itemModifier._id.equals(modifier._id)) {
                added = true;
                result.push({
                    toSelect: modifier.amountOfOptions,
                    toSelectAmount: modifier.amountToSelect,
                    subtitle: getModifierSubtitle(modifier.amountToSelect, modifier.amountOfOptions),
                    options: modifier.options,
                    required: modifier.required,
                    _id: modifier._id,
                    title: modifier.name,
                    selected: itemModifier.selected || [],
                });
            }   
        }
        if(!added) {
            result.push({
                toSelect: modifier.amountOfOptions,
                toSelectAmount: modifier.amountToSelect,
                subtitle: getModifierSubtitle(modifier.amountToSelect, modifier.amountOfOptions),
                options: modifier.options,
                required: modifier.required,
                _id: modifier._id,
                title: modifier.name,
                selected: [],
            });
        }
    }
    

    res.send({ selected: result, modifiers: item.modifiers });
});

router.get("/collections/:collectionId", customerRestaurant({ collections: 1, sorting: 1 }), customerSession({}, {}), async (req, res) => {
    const { collectionId } = req.params;
    const { restaurant, session } = res.locals as Locals;

    if(!restaurant.collections) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    if(!restaurant.sorting || !restaurant.sorting.days || !restaurant.sorting.times) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const date = new Date();
    const day = date.getDay();
    const time = (() => {
        const hours = date.getHours();
        if(hours >= 17) {
            if(hours > 20) {
                return "night";
            } else {
                return "evening";
            }
        } else if(hours < 17) {
            if(hours < 12) {
                if(hours < 5) {
                    return "night";
                } else {
                    return "morning";
                }
            } else {
                return "afternoon";
            }
        }
        return null!
    })();

    const collectionAvailable = (id: ObjectId) => {
        let timeAvailable = false;
        let dayAvailable = false;

        for(const collection of restaurant.sorting!.days[day as 0].collections) {
            if(collection.equals(id)) {
                dayAvailable = true;
                break;
            }
        }
        for(const collection of restaurant.sorting!.times[time].collections) {
            if(collection.equals(id)) {
                timeAvailable = true;
                break;
            }
        }
        
        return timeAvailable && dayAvailable;
    }
    const itemAvailable = (id: ObjectId) => {
        let timeAvailable = false;
        let dayAvailable = false;

        for(const collection of restaurant.sorting!.days[day as 0].items) {
            if(collection.equals(id)) {
                dayAvailable = true;
                break;
            }
        }
        for(const collection of restaurant.sorting!.times[time].items) {
            if(collection.equals(id)) {
                timeAvailable = true;
                break;
            }
        }
        
        return timeAvailable && dayAvailable;
    }
    const getCollection = () => {
        for(const collection of restaurant.collections) {
            if(collection.id == collectionId) {
                return collection;
            }
        }
        return null;
    }

    
    const collection = getCollection();
    
    if(!collection) {
        return res.status(404).send({ reason: "CollectionNotFound" });
    }

    if(!collectionAvailable(collection._id)) {
        return res.status(403).send({ reason: "CollectionNotAvailable" });
    }

    for(const i in collection.items) {
        if(!itemAvailable(collection.items[i])) {
            collection.items.splice(+i, 1);
        }
    }


    const items = await getItems(
        restaurant._id,
        { _id: { $in: collection.items }, status: "visible", },
        { projection: {
            id: 1,
            _id: 1,
            status: 1,
            info: {
                name: 1,
                price: 1,
                description: 1,
            },
            library: { modified: 1 },
        } }
    ).toArray();

    const itemsMap = new Map();
    for(const item of items) {
        itemsMap.set(item._id.toString(), item);
    }

    for(const itemId in collection.items) {
        if(!itemsMap.has(collection.items[itemId].toString())) {
            collection.items.splice(+itemId, 1);
        }
    }
    


    res.send({
        collection: {
            name: collection.name,
            _id: collection._id,
            id: collection.id,
            description: collection.description,
            items: collection.items,
        },
        items: Object.fromEntries(itemsMap.entries()),
    });

    const timeline: TimelineComponent = {
        action: "page",
        time: Date.now(),
        page: "collection",
        userId: "customer",
        collectionId: collection._id,
    };

    updateSession(restaurant._id, { _id: session._id, }, { $push: { timeline } }, { noResponse: true, });
});
router.get("/collections/:collectionId/image", async (req, res) => {
    const { collectionId, restaurantId, } = req.params as any;

    const result = await aggregateRestaurant([
        { $match: { _id: id(restaurantId), } },
        { $unwind: "$collections" },
        { $match: { "collections.id": collectionId } },
        { $project: { "collectionImage": "$collections.image.buffer" } },
    ]).toArray();

    if(!result || result.length == 0) {
        return res.status(404).send({ reason: "CollectionNotFound" });
    }

    const collection = result[0];

    if(!collection.collectionImage) {
        return res.status(404).send({ reason: "ImageNotFound" });
    }

    res.set("Content-Type", "image/png");
    res.set("Content-Length", collection.collectionImage.buffer.length);
    res.send(collection.collectionImage.buffer);
});


router.get("/tracking", customerRestaurant({}), customerSession({}, {}), async (req, res) => {
    const { user, restaurant, session } = res.locals as Locals;

    const sessions = await getSessions(
        restaurant._id,
        { "customer.customerId": user?._id, status: "progress" },
        { projection: { items: { itemId: 1, status: 1, _id: 1 } } }
    ).toArray();

    if (!sessions || sessions.length == 0) {
        return res.send({ logged: !!user, items: [] });
    }

    const getIds = () => {
        const result = [];
        for (let session of sessions) {
            for (let item of session.items) {
                result.push(item.itemId);
            }
        }
        return result;
    };

    const items = await getItems(restaurant._id, { _id: { $in: getIds() } }, { projection: { info: { name: 1 }, library: { original: 1 } } }).toArray();

    const getMap = () => {
        const result = new Map<string, { name: string; image: any }>();
        for (let item of items) {
            result.set(item._id.toString(), { name: item.info.name, image: item.library?.original });
        }
        return result;
    }

    const map = getMap();

    const result = [];

    for (let session of sessions) {
        for (let item of session.items) {
            const d = map.get(item.itemId.toString());
            result.push({
                status: item.status,
                name: d?.name,
                image: d?.image,
                _id: item._id,
                itemId: item.itemId,
            });
        }
    }


    res.send({
        items: result,
        logged: !!user,
    });
});




export {
    router as CustomerRouter,
}


