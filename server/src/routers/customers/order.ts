import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { Location } from "../../models/restaurant.js";
import { TimelineComponent, SessionType } from "../../models/session.js";
import { getItems } from "../../utils/data/items.js";
import { customerRestaurant } from "../../middleware/customerRestaurant.js";
import { customerSession } from "../../middleware/customerSession.js";
import { updateSession } from "../../utils/data/sessions.js";





const router = Router({ mergeParams: true });



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

    const timeline: TimelineComponent = {
        action: "comment",
        time: Date.now(),
        userId: "customer"
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id, },
        { $set: { "info.comment": comment }, $push: { timeline } },
        { projection: { _id: 1 } }
    );

    res.send({ updated: update.ok == 1 });
});
router.get("/preview", customerRestaurant({ locations: { _id: 1, city: 1, line1: 1, settings: { customers: 1, } } }), customerSession({ items: 1, info: 1 }, {}), async (req, res) => {
    const { restaurant, session, user } = res.locals as Locals;

    const itemsId: ObjectId[] = [];

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


    for (let item of session.items) {
        itemsId.push(item.itemId);
    }

    const items = await getItems(restaurant._id, { _id: { $in: itemsId } }, { projection: { info: { name: 1, price: 1, }, modifiers: { _id: 1, options: { _id: 1, price: 1 } }, id: 1, library: { preview: 1, } } }).toArray();

    const convertedItemes = [];

    const findItem = (itemId: ObjectId) => {
        for (let item of items) {
            if (item._id.equals(itemId)) {
                return item;
            }
        }
        return null!;
    }

    let subtotal = 0;

    for (let d of session.items) {
        const item = findItem(d.itemId);

        if (!item) {

            updateSession(restaurant._id, { _id: session._id }, { $pull: { items: { itemId: d.itemId } } }, { noResponse: true });

            continue;
        }

        let modifiersPrice = 0;

        if(item.modifiers && d.modifiers) {
            for(const modifier of item.modifiers!) {
                for(const sessionItemModifier of d.modifiers) {
                    if(modifier._id.equals(sessionItemModifier._id)) {
                        for(const sdmo of sessionItemModifier.selected) {
                            for(const modifierOption of modifier.options) {
                                if(sdmo.equals(modifierOption._id)) {
                                    modifiersPrice += modifierOption.price;
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }

        convertedItemes.push({
            name: item.info.name,
            price: item.info.price + modifiersPrice,
            image: item.library?.preview,
            itemId: item.id,
            itemObjectId: item._id,
            _id: d._id,
            comment: d.info.comment
        });

        subtotal += item.info.price + modifiersPrice;

    }



    res.send({
        items: convertedItemes,
        subtotal,
        info: session.info,
        address: `${location.city}, ${location.line1}`,
        settings: { ...location.settings.customers, allowDelivery: false },
    });
});
router.put("/type", customerRestaurant({ info: { name: 1 }, locations: { _id: 1, settings: { customers: 1 } }}), customerSession({ info: { type: 1, id: 1, } }, {}), async (req, res) => {
    const { restaurant, session, } = res.locals as Locals;
    const { type } = req.body;

    if (!type) {
        return res.status(400).send({ reason: "TypeNotProvided" });
    }
    if (typeof type != "string" || !["dinein", "takeout", "delivery"].includes(type)) {
        return res.status(422).send({ reason: "InvalidInput" });
    }
    if(!restaurant.locations || restaurant.locations.length == 0) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    
    const getLocation = () => {
        for(const location of restaurant.locations!) {
            if(location._id.equals(session.info.location)) {
                return location;
            }
        }
        return null;
    }

    const location = getLocation();
    if(!location) {
        return res.status(404).send({ reason: "LocationNotFound" });
    }

    if(
        (type == "takeout" && !location.settings.customers?.allowTakeOut) ||
        (type == "dinein" && !location.settings.customers?.allowDineIn) ||
        (type == "delivery" && !location.settings.customers?.allowDelivery)
    ) {
        return res.status(403).send({ reason: "TypeNotAllowed" });
    }
    if (session.info.type == type) {
        return res.send({ updated: true, id: session.info.id });
    }

    let id = null;

    if (type == "takeout") {
        id = Math.floor(Math.random() * 9000 + 1000).toString();
    } else if(type == "delivery") {
        id = `D-${restaurant.info.name?.slice(0, 2).toUpperCase()}` + Math.floor(Math.random() * 9000 + 1000).toString();
    }


    const timeline: TimelineComponent = {
        action: "type",
        time: Date.now(),
        userId: "customer",
    }


    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        {
            $set: { "info.type": type as SessionType, "info.id": id! },
            $push: { timeline },
        },
        { projection: { _id: 1 } }
    );


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

    const timeline: TimelineComponent = {
        action: "id",
        userId: "customer",
        time: Date.now(),
    }

    if (!tableNumber) {
        return res.status(400).send({ reason: "InvalidTable" });
    }

    const update = await updateSession(restaurant._id, { _id: session._id }, { $set: { "info.id": tableNumber.toString() }, $push: { timeline } }, { projection: { _id: 1 } });

    res.send({ updated: update.ok == 1, table: tableNumber.toString() });
});


export {
    router as OrderRouter,
}