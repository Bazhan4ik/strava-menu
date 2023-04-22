import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { SessionItem } from "../../models/session.js";
import { getItem, getItems } from "../../utils/data/items.js";
import { id } from "../../utils/other/id.js";
import { waiterManualOrder, waiterSession } from "../../middleware/waiterManualOrder.js";
import { confirmSession, createSession, getSession, getSessions, updateSession } from "../../utils/data/sessions.js";



const router = Router({ mergeParams: true });


router.get("/", waiterManualOrder({}, { folders: 1, collections: 1 }), async (req, res) => {
    const { restaurant, user, location } = res.locals as Locals;
    const { socketId } = req.query;

    if(!socketId || typeof socketId != "string") {
        return res.status(400).send({ reason: "SocketId" });
    }

    if(!restaurant.collections || !restaurant.folders) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    let session = await getSession(
        restaurant._id,
        { "customer.by": "staff", "customer.onBehalf": user._id, status: "ordering", },
        { projection: { items: 1, } },
    );

    let itemsSelected = 0;
    
    if(!session) {
        session = {
            _id: id(),
            customer: {
                by: "staff",
                onBehalf: user._id,
                socketId,
            },
            items: [],
            info: {
                id: null!,
                type: "dinein",
                location: location,
            },
            status: "ordering",
            timing: { },
            timeline: [],
            waiterRequests: [],
        };

        const update = await createSession(restaurant._id, session);

        if(!update.insertedId) {
            return res.status(500).send({ reason: "InvalidError" });
        }
    }


    const getCollection = (id: ObjectId) => {
        for(const collection of restaurant.collections) {
            if(collection._id.equals(id)) {
                itemsIds.push(...collection.items);
                return collection;
            }
        }
        return null!;
    }

    const itemsIds: ObjectId[] = [];
    const result = [];

    

    for(const folder of restaurant.folders) {

        if(folder.id == "other") {
            continue;
        }

        const collections = [];

        for(const c of folder.collections) {
            const collection = getCollection(c);

            if(!collection || collection.items.length == 0) {
                continue;
            }

            collections.push(collection);
        }

        result.push({ ...folder, collections });
    }


    const items = await getItems(restaurant._id, { _id: { $in: itemsIds } }, { projection: { info: { name: 1, price: 1, }, modifiers: { _id: 1 }, id: 1, _id: 1, } }).toArray();
    const itemsMap = new Map<string, any>();
    for(const item of items) {
        (item as any).amount = 0;
        for(const sessionItem of session.items) {
            if(item._id.equals(sessionItem.itemId)) {
                itemsSelected++;
                (item as any).amount++;
            }
        }
        itemsMap.set(item._id.toString(), {...item, hasModifiers: !!item.modifiers && item.modifiers.length! > 0 });
    }

    res.send({ folders: result, items: Object.fromEntries(itemsMap.entries()), itemsSelected, });
});

router.post("/item", waiterManualOrder({}, { }), waiterSession({ info: { type: 1 } }), async (req, res) => {
    const { restaurant, session } = res.locals as Locals;
    const { itemId, comment, modifiers } = req.body;

    if(!itemId || typeof itemId != "string" || itemId.length != 24 || (comment && typeof comment != "string")) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    const item = await getItem(
        restaurant._id,
        { _id: id(itemId) },
        { projection: { modifiers: { _id: 1, required: 1, options: { _id: 1, } } } }
    );

    if(!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }

    const itemGeneratedId = () => {

        // 3 random numbers at the end
        const rand = Math.floor(Math.random() * 900 + 100).toString();

        // either order type first letter (T | D) and 1 number of order id or first letter of last name of the customer
        const orderIndicator = "MO" + session.info.type[0].toUpperCase();

        return `${orderIndicator}-${rand}`;
    }
    const findModifier = (id: ObjectId) => {
        for(const m of modifiers) {
            if(id.equals(m._id)) {
                return m;
            }
        }
        return null!;
    }
    const checkModifiers = () => {
        const result: { _id: ObjectId; selected: ObjectId[] }[] = [];

        for(let modifierIndex = 0; modifierIndex < item!.modifiers!.length!; modifierIndex++) {
            const modifier = item!.modifiers![modifierIndex];

            const m = findModifier(modifier._id);

            if(!m) {
                if(modifier.required) {
                    return null;
                }
                continue;
            }

            if(!m.selected) {
                return null;
            }

            if(modifier.amountToSelect == "one") {
                if(m.selected.length != 1) {
                    return null;
                }
            } else if(modifier.amountToSelect == "more") {
                if(m.selected!.length < modifier.amountOfOptions) {
                    return null;
                }
            } else if(modifier.amountToSelect == "less") {
                if(m.selected.length > modifier.amountOfOptions) {
                    return null;
                }
            }

            const selectedOptions: ObjectId[] = [];

            for(const optionId of m.selected) {
                if(typeof optionId != "string") {
                    return null;
                }

                let found = false;
                for(const option of modifier.options) {
                    if(option._id.equals(optionId)) {
                        selectedOptions.push(option._id);
                        found = true;
                        break;
                    }
                }
                if(!found) {
                    return;
                }
            }
            result.push({ _id: modifier._id, selected: selectedOptions });
        }

        return result;
    }

    const convertedModifiers = checkModifiers();
    if(!convertedModifiers) {
        return res.status(400).send({ reason: "InvalidModifiers" });
    }


    const newItem: SessionItem = {
        _id: id(),
        itemId: id(itemId),
        modifiers: convertedModifiers,
        info: {
            comment,
            id: itemGeneratedId(),
        },
        status: "ordered",
    };

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $push: { items: newItem } },
        { projection: { _id: 1 } }
    );


    res.send({ updated: update.ok == 1 });
});
router.put("/item/comment", waiterManualOrder({}, {}), waiterSession({ }), async (req, res) => {
    const { sessionItemId, comment } = req.body;
    const { restaurant, session } = res.locals as Locals;

    if(!sessionItemId || !comment || typeof sessionItemId != "string" || sessionItemId.length != 24 || typeof comment != "string") {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "items.$[item].info.comment": comment } },
        { arrayFilters: [ { "item._id": id(sessionItemId) } ], projection: { _id: 1 } }
    );


    res.send({ updated: update.ok == 1 });
});
router.delete("/item/:sessionItemId", waiterManualOrder({}, {}), waiterSession({ items: { _id: 1 } }), async (req, res) => {
    const { restaurant, session } = res.locals as Locals;
    const { sessionItemId } = req.params;


    if(sessionItemId.length != 24) {
        return res.status(400).send({ reason: "InvalidId" });
    }
    if(!session.items) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $pull: { items: { _id: id(sessionItemId) } } },
        { projection: { _id: 1 } },
    );

    res.send({ updated: update.ok == 1 });
});
router.put("/item/modifiers", waiterManualOrder({}, {}), async (req, res) => {
    const { sessionItemId, itemId } = req.query;
    const { modifiers } = req.body;
    const { restaurant } = res.locals as Locals;

    if(typeof sessionItemId != "string" || sessionItemId.length != 24) {
        return res.status(400).send({ reason: "InvalidSessionItemId" });
    }
    if(typeof itemId != "string" || itemId.length != 24) {
        return res.status(400).send({ reason: "InvalidItemId" });
    }



    const item = await getItem(
        restaurant._id,
        { _id: id(itemId) },
        { projection: { modifiers: { _id: 1, required: 1, options: { _id: 1, } } } },
    )


    const findModifier = (id: ObjectId) => {
        for(const m of modifiers) {
            if(id.equals(m._id)) {
                return m;
            }
        }
        return null!;
    }
    const checkModifiers = () => {
        const result: { _id: ObjectId; selected: ObjectId[] }[] = [];

        for(let modifierIndex = 0; modifierIndex < item!.modifiers!.length!; modifierIndex++) {
            const modifier = item!.modifiers![modifierIndex];

            const m = findModifier(modifier._id);

            if(!m) {
                if(modifier.required) {
                    return null;
                }
                continue;
            }

            if(!m.selected) {
                return null;
            }

            if(modifier.amountToSelect == "one") {
                if(m.selected.length != 1) {
                    return null;
                }
            } else if(modifier.amountToSelect == "more") {
                if(m.selected!.length < modifier.amountOfOptions) {
                    return null;
                }
            } else if(modifier.amountToSelect == "less") {
                if(m.selected.length > modifier.amountOfOptions) {
                    return null;
                }
            }

            const selectedOptions: ObjectId[] = [];

            for(const optionId of m.selected) {
                if(typeof optionId != "string") {
                    return null;
                }

                let found = false;
                for(const option of modifier.options) {
                    if(option._id.equals(optionId)) {
                        selectedOptions.push(option._id);
                        found = true;
                        break;
                    }
                }
                if(!found) {
                    return;
                }
            }
            result.push({ _id: modifier._id, selected: selectedOptions });
        }

        return result;
    }

    const convertedModifiers = checkModifiers();
    if(!convertedModifiers) {
        return res.status(400).send({ reason: "InvalidModifiers" });
    }

    const update = await updateSession(
        restaurant._id,
        { items: { $elemMatch: { _id: id(sessionItemId) } } },
        { $set: { "items.$[item].modifiers": convertedModifiers } },
        { arrayFilters: [{ "item._id": id(sessionItemId) }], projection: { _id: 1 } },
    );

    res.send({ updated: update.ok == 1 });
});

router.get("/checkout", waiterManualOrder({}, { locations: { settings: 1, _id: 1 } }), waiterSession({ info: 1, items: { _id: 1, modifiers: 1, info: { comment: 1, }, itemId: 1, } }), async (req, res) => {
    const { restaurant, location, session } = res.locals as Locals;
    

    if(!restaurant.locations || !session.items) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getLocation = () => {
        for(const l of restaurant.locations!) {
            if(l._id.equals(location)) {
                return l;
            }
        }
        return null;
    }
    const convertItemsAndCalculateMoney = async () => {
        if(session.items.length == 0) {
            return { status: 400, reason: "InvalidItems" };
        }
        const result = await calculateAmount(restaurant._id, session.items, session.payment?.money?.tip, restaurantLocation!.settings.serviceFee!);

        if (!result) {
            return { status: 500, reason: "InvalidItems" };
        }
        if (!result || !result.money.total) {
            return { status: 403, reason: "InvalidAmount" };
        }
        return result;
    }


    const restaurantLocation = getLocation();
    if(!restaurantLocation) {
        return res.status(400).send({ reason: "InvalidLocation" });
    }

    const result: any = {

    }


    const calcres = await convertItemsAndCalculateMoney();
    if ((typeof (calcres as any).status == "number")) {
        return res.status((calcres as any).status || 500).send({ reason: (calcres as any).reason || "InvalidError" });
    } else {
        result.money = (calcres as any).money;
        result.items = (calcres as any).items;
    }

    result.order = {
        id: session.info?.id,
        type: session.info?.type
    }


    res.send(result);

    updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "payment.money": result.money } },
        { noResponse: true }
    );
});

router.get("/tables", waiterManualOrder({}, { tables: 1 }), async (req, res) => {
    const { location, restaurant } = res.locals as Locals;

    if(!restaurant.locations || !restaurant.tables) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getLocationId = () => {
        for(const restaurantLocation of restaurant.locations!) {
            if(restaurantLocation._id.equals(location)) {
                return restaurantLocation.id;
            }
        }
        return null!;
    }

    const tables = restaurant.tables[getLocationId()];

    if(!tables) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const sessions = await getSessions(
        restaurant._id,
        { "info.location": location, "info.type": "dinein" },
        { projection: { info: { id: 1 } } },
    ).toArray();


    const result = [];
    for(const table of tables) {
        let taken = false;
        for(const session of sessions) {
            if(session.info?.id == table.id.toString()) {
                taken = true;
                break;
            }
        }
        result.push({
            ...table,
            taken,
        });
    }

    res.send(result);
});

router.put("/table", waiterManualOrder({}, { tables: 1 }), waiterSession({ info: 1 }), async (req, res) => {
    const { location, restaurant, session } = res.locals as Locals;
    const { tableId } = req.body;

    if(!tableId || typeof tableId != "string" || tableId.length != 24) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(!restaurant.locations || !restaurant.tables || !session.info) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(session.info.type != "dinein") {
        return res.status(403).send({ reason: "Type" });
    }

    const getLocationId = () => {
        for(const restaurantLocation of restaurant.locations!) {
            if(restaurantLocation._id.equals(location)) {
                return restaurantLocation.id;
            }
        }
        return null!;
    }
    const getTable = () => {
        for(const table of tables!) {
            if(table._id.equals(tableId)) {
                return table;
            }
        }
        return null!;
    }

    const tables = restaurant.tables[getLocationId()];

    if(!tables) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const table = getTable();
    if(!table) {
        return res.status(404).send({ reason: "TableNotFound" });
    }

    if(table.id.toString() == session.info.id) {
        return res.send({ updated: true });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "info.id": table.id.toString() } },
        { projection: { _id: 1 } },
    );


    res.send({ updated: update.ok == 1 });
});


router.post("/payed", waiterManualOrder({}), waiterSession({ }), async (req, res) => {
    const { restaurant, session } = res.locals as Locals;




    const result = await confirmSession({
        restaurantId: restaurant._id,
        sessionId: session._id,
        payed: true,
    });


    res.send({ updated: result });
});

router.get("/modifiers/:itemId", waiterManualOrder({ }), async (req, res) => {
    const { itemId } = req.params;
    const { sessionItemId } = req.query;
    const { restaurant } = res.locals as Locals;

    if(itemId.length != 24) {
        return res.status(400).send({ reason: "InvalidItemId" });
    }
    if(sessionItemId && (typeof sessionItemId != "string" || sessionItemId.length != 24)) {
        return res.status(400).send({ reason: "InvalidSessionItemId" });
    }

    const item = await getItem(
        restaurant._id,
        { _id: id(itemId) },
        { projection: { modifiers: 1 } },
    );

    if(!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
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
        for(const modifier of item!.modifiers!) {
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

    const modifiers = getModifiers();

    if(!sessionItemId) {
        return res.send({ modifiers });
    }


    const session = await getSession(
        restaurant._id,
        { items: { $elemMatch: { _id: id(sessionItemId) } } },
        { projection: { items: { _id: 1, modifiers: 1 } } }
    );

    if(!session) {
        return res.status(404).send({ reason: "SessionNotFound" });
    }

    const findItem = () => {
        for(const item of session.items) {
            if(item._id.equals(sessionItemId)) {
                return item;
            }
        }
        return null;
    }

    const sessionItem = findItem();
    if(!sessionItem) {
        return res.status(404).send({ reason: "SessionItemNotFound" });
    }
    if(!sessionItem.modifiers) {
        return res.send({ modifiers });
    }

    for(const modifier of modifiers) {
        for(const sessionItemModifier of sessionItem.modifiers!) {
            if(modifier._id.equals(sessionItemModifier._id)) {
                (modifier as any).selected = sessionItemModifier.selected;
                break;
            }
        }
    }

    res.send({ modifiers });
});


export {
    router as OrderRouter
}


async function calculateAmount(restaurantId: ObjectId, sessionItems: SessionItem[], tip: number = 0, serviceFee?: { amount: number; type: 1 | 2 }) {
    const itemsIds: ObjectId[] = [];


    for (let item of sessionItems) {
        itemsIds.push(item.itemId);
    }

    const items = await getItems(restaurantId, { _id: { $in: itemsIds } }, { projection: { library: { preview: 1, }, modifiers: { _id: 1, options: { price: 1, _id: 1, } }, info: { price: 1, name: 1, }, } }).toArray();

    const convertedItems: {
        name: string;
        price: number;
        image: any;
        _id: ObjectId;
        itemId: ObjectId;
        comment: string;
    }[] = [];


    const findItem = (itemId: ObjectId) => {
        for (let item of items) {
            if (item._id.equals(itemId)) {
                return item;
            }
        }
        return null!;
    }

    let subtotal = 0;

    for (let it of sessionItems) {
        const item = findItem(it.itemId);

        if (!item) {
            return null;
        }

        if(item.modifiers && it.modifiers) {
            for(const modifier of item.modifiers!) {
                for(const sessionItemModifier of it.modifiers) {
                    if(modifier._id.equals(sessionItemModifier._id)) {
                        for(const sdmo of sessionItemModifier.selected) {
                            for(const modifierOption of modifier.options) {
                                if(sdmo.equals(modifierOption._id)) {
                                    item.info.price += modifierOption.price;
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }

        convertedItems.push({
            name: item.info?.name,
            price: item.info?.price,
            image: item.library?.preview,
            itemId: item._id,
            _id: it._id,
            comment: it.info?.comment,
        });

        subtotal += item.info.price;
    }

    const hst = subtotal * 0.13;
    const service = serviceFee ? serviceFee?.type == 1 ? serviceFee.amount : subtotal * serviceFee.amount / 100 : null!;
    const total = hst + subtotal + (service || 0) + tip;


    return {
        money: {
            subtotal: Math.floor(subtotal),
            hst: Math.floor(hst),
            total: Math.floor(total),
            service: Math.floor(service),
            tip: Math.floor(tip),
        },
        items: convertedItems,
    };
}