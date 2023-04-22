import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { SessionItem, TimelineComponent } from "../../models/session.js";
import { id } from "../../utils/other/id.js";
import { getItem } from "../../utils/data/items.js";
import { customerRestaurant } from "../../middleware/customerRestaurant.js";
import { customerSession } from "../../middleware/customerSession.js";
import { updateSession } from "../../utils/data/sessions.js";





const router = Router({ mergeParams: true });

router.post("/", customerRestaurant({}), customerSession({ info: { type: 1, id: 1 } }, { info: { name: { first: 1 } } }), async (req, res) => {
    const { restaurant, session, user } = res.locals as Locals;
    const { itemId, comment, modifiers } = req.body;

    if (!itemId) {
        return res.status(400).send({ reason: "itemIdNotProvided" });
    }

    if (typeof itemId != "string" || itemId.length != 24 || (comment && typeof comment != "string")) {
        return res.status(422).send({ reason: "InvalidInput" });
    }


    const item = await getItem(
        restaurant._id,
        { _id: id(itemId) },
        { projection: {
            modifiers: {
                _id: 1,
                amountToSelect: 1,
                amountOfOptions: 1,
                required: 1,
                options: { _id: 1, price: 1, }
            }
        } }
    );

    if(!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }
    if(modifiers && !item.modifiers) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    if(!modifiers && item.modifiers) {
        return res.status(400).send({ reason: "ModifiersNotProvided" });
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

        for(let modifierIndex = 0; modifierIndex < item.modifiers!.length!; modifierIndex++) {
            const modifier = item.modifiers![modifierIndex];

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
    const itemGeneratedId = () => {

        // 3 random numbers at the end
        const rand = Math.floor(Math.random() * 900 + 100).toString();

        // either order type first letter (T | D) and 1 number of order id or first letter of last name of the customer
        const orderIndicator = session.info.id ? session.info.type[0].toUpperCase() + session.info.id[0] : user?.info?.name?.first[0] || Math.floor(Math.random() * 90 + 10);

        return `${orderIndicator}:${rand}`;
    }


    const convertedModifiers = checkModifiers();

    if(!convertedModifiers) {
        return res.status(400).send({ reason: "InvalidModifiers" });
    }

    const newItem: SessionItem = {
        itemId: id(itemId),
        _id: id(),
        status: "ordered",
        modifiers: convertedModifiers,
        info: {
            comment: comment || null!,
            id: itemGeneratedId(),
        },
    };

    const timeline: TimelineComponent = {
        action: "item/add",
        userId: "customer",
        time: Date.now(),
        sessionItemId: newItem._id,
    }


    const update = await updateSession(
        restaurant._id,
        { _id: session._id, },
        { $push: { items: newItem, timeline: timeline } },
        { projection: { _id: 1, } }
    );


    res.send({
        insertedId: newItem._id,
    });
});
router.put("/:orderitemId/comment", customerRestaurant({}), customerSession({ items: { _id: 1, info: { comment: 1 } } }, {}), async (req, res) => {
    const { orderitemId } = req.params;
    const { session, restaurant } = res.locals as Locals;
    let { comment } = req.body;

    if (!comment) {
        return res.status(400).send({ reason: "CommentNotProvided" });
    }

    if (typeof comment != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    for (let item of session.items) {
        if (item._id.equals(orderitemId)) {
            if (item.info.comment == comment) {
                return res.send({ updated: true });
            }
        }
    }

    if (comment == "remove") {
        comment = null;
    }

    const timeline: TimelineComponent = {
        action: "item/comment",
        time: Date.now(),
        sessionItemId: id(orderitemId),
        userId: "customer",
    };

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "items.$[item].info.comment": comment }, $push: timeline },
        { arrayFilters: [{ "item._id": id(orderitemId) }] }
    );

    res.send({ updated: update.ok == 1 });
});
router.delete("/:orderitemId", customerRestaurant({}), customerSession({ items: { _id: 1, itemId: 1 }}, {}), async (req, res) => {
    const { orderitemId } = req.params;
    const { restaurant, session } = res.locals as Locals;

    if (!orderitemId || orderitemId.length != 24) {
        return res.status(400).send({ reason: "InvalidId" });
    }
    if(!session.items) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getitemId = () => {
        for(const sitem of session.items) {
            if(sitem._id.equals(orderitemId)) {
                return sitem.itemId;
            }
        }
        return null;
    }

    const timeline: TimelineComponent = {
        action: "item/remove",
        itemId: getitemId()!,
        time: Date.now(),
        userId: "customer",
    };


    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $pull: { "items": { _id: id(orderitemId) } }, $push: { timeline } },
        { projection: { _id: 1 } }
    );

    res.send({
        updated: update.ok == 1,
    });
});
router.put("/:sessionItemId/modifiers", customerRestaurant({}), customerSession({ }, { }), async (req, res) => {
    const { sessionItemId } = req.params;
    const { modifiers } = req.body;
    const { itemId } = req.query;
    const { restaurant, session } = res.locals as Locals;

    if(sessionItemId.length != 24) {
        return res.status(400).send({ reason: "InvalidSessionitemId" });
    }
    if(typeof itemId != "string" || itemId.length != 24) {
        return res.status(400).send({ reason: "InvaliditemId" });
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
                        newPrice += option.price;
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
    
    const item = await getItem(
        restaurant._id,
        { _id: id(itemId) },
        { projection: { info: { price: 1 }, modifiers: { _id: 1, required: 1, options: { _id: 1, price: 1 } } } }
    );

    if(!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }

    let newPrice = item?.info.price;

    const convertedModifiers = checkModifiers();


    const timeline: TimelineComponent = {
        action: "item/modifiers",
        sessionItemId: id(sessionItemId),
        userId: "customer",
        time: Date.now(),
    }


    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "items.$[item].modifiers": convertedModifiers }, $push: { timeline } },
        { arrayFilters: [ { "item._id": id(sessionItemId) } ] }
    );

    res.send({ newPrice, updated: update.ok == 1 });
});



export {
    router as ItemRouter
}