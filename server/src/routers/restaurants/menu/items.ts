import { Router } from "express";
import { ObjectId } from "mongodb";
import sharp from "sharp";
import { Item, Modifier } from "../../../models/item.js";
import { Locals } from "../../../models/general.js";
import { addItem, deleteItem, updateItem, getItems, getItem } from "../../../utils/data/items.js";
import { id } from "../../../utils/other/id.js";
import { logged } from "../../../middleware/auth.js";
import { restaurantWorker } from "../../../middleware/restaurant.js";
import { bufferFromString } from "../../../utils/other/bufferFromString.js";
import { getIngredients } from "../../../utils/data/ingredients.js";
import { getTags } from "../../../utils/other/tags.js";
import { updateRestaurant } from "../../../utils/data/restaurant.js";
import { getOrders, updateOrders } from "../../../utils/data/orders.js";
import { NewLineKind } from "typescript";
import { getSessions } from "../../../utils/data/sessions.js";



const router = Router({ mergeParams: true });




router.post("/", logged(), restaurantWorker({ sorting: 1, }, { items: { adding: true } }), async (req, res) => {
    const { name, price, description, tags, ingredients, image } = req.body;
    const { restaurant, user } = res.locals as Locals;

    if(!restaurant.sorting || !restaurant.sorting.days || !restaurant.sorting.times) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(!name || !price) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    if(price < 100) {
        return res.status(422).send({ reason: "InvalidPrice" });
    }
    
    
    const newItem: Item = {
        info: {
            name: name,
            description: description || null!,
            price: price,
        },

        status: "visible",
        
        library: null!,
        id: name.replace(/[^\w\s]/gi, "").replace(/\s/g, "-").toLowerCase(),
        _id: id(),
        ingredients: null!,
        tags: [],
        modifiers: [],
    };
    
    if(!newItem.id || newItem.id.length == 0) {
        return res.status(400).send({ reason: "InvalidName" });
    }

    if(tags) {
        newItem.tags = [];
        for(let tag of tags) {
            if(tag.id) {
                newItem.tags.push(tag.id);
            }
        }
    }


    if(ingredients) {
        newItem.ingredients = [];
        for(let ing of ingredients) {
            if(ing.id && ing.amount && ing.amount > 0) {
                newItem.ingredients.push({
                    id: ing.id,
                    amount: ing.amount,
                });
            }
        }
    }

    
    if(image) {
        if(image.resolution && image.base64 && typeof image.resolution == "number" && typeof image.base64 == "string") {
            const buffer = bufferFromString(image.base64);
            const resolution = image.resolution;

            const preview = await sharp(buffer).jpeg({ quality: 60 }).toBuffer();
            const blur = await sharp(buffer).jpeg({ quality: 20 }).blur(40).toBuffer();
            const original = await sharp(buffer).resize(1000, 1000, { fit: "cover" }).jpeg().toBuffer();

            newItem.library = {
                preview: preview as any,
                blur: blur as any,
                modified: Date.now(),
                userId: user._id,
                original: original as any,
            };
        }
    }


    const result = await addItem(restaurant._id, newItem);

    res.send({
        updated: result,
    });

    const $push: any = {};
    for(const day of Object.keys(restaurant.sorting?.days)) {
        $push[`sorting.days.${day}.items`] = newItem._id;
    }
    for(const time of Object.keys(restaurant.sorting?.times)) {
        $push[`sorting.times.${time}.items`] = newItem._id;
    }

    updateRestaurant(
        { _id: restaurant._id },
        { $push },
        { noResponse: true }
    );
});
router.get("/", logged(), restaurantWorker({}, { items: { available: true } }), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;


    const items = await getItems(restaurant._id, { }, { projection: { status: 1, info: { name: 1, price: 1 }, id: 1 } }).toArray();

    const result: {
        name: string;
        price: number;
        id: string;
        _id: ObjectId;
        status: string;
    }[] = [];

    for(let item of items) {
        result.push({
            name: item.info.name,
            price: item.info.price,
            id: item.id,
            _id: item._id,
            status: item.status,
        });
    }


    res.send({
        items: result,
        restaurantId: restaurant._id,
    });
});
router.get("/:itemId", logged(), restaurantWorker({ collections: { name: 1, image: 1, _id: 1, items: 1, id: 1, }, }, { items: { available: true } }), async (req, res) => {
    const { itemId } = req.params;
    const { restaurant } = res.locals as Locals;

    if(!restaurant.collections) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(!itemId) {
        return res.status(404).send({ reason: "ItemIdNotProvided" });
    }

    const getSelectTitle = (modifier: Modifier) => {
        if(modifier.amountToSelect == "more") {
            return `More than ${modifier.amountOfOptions} options`;
        } else if(modifier.amountToSelect == "less") {
            return `Up to ${modifier.amountOfOptions} options`;
        } else if(modifier.amountToSelect == "one") {
            return "Just one";
        }
    }
    const getModifiers = () => {

        if(!item?.modifiers) {
            return [];
        }

        
        const result = [];
        for(const modifier of item!.modifiers) {
            const options = [];
            for(const option of modifier.options) {
                options.push({
                    ...option,
                    price: option.price / 100,
                });
            }
            result.push({
                ...modifier,
                options,
                toSelectTitle: getSelectTitle(modifier),
            });
        }
        return result;
    }
    const getLastWeek = () => {
        // date of last week's day
        const date = new Date(Date.now() - 604_800_000);

        // set time to midnight
        date.setHours(0, 0, 0);

        return date.getTime();
    }
    const getAverageSales = () => {
        let sumOfDifferences = 0;

        for (let i = 0; i < sales.length - 1; i++) {
            const diff = sales[i+1] - sales[i];
            sumOfDifferences += diff;
        }

        const avgOfDifferences = sumOfDifferences / (sales.length - 1);

        return +avgOfDifferences.toFixed(2);
    }
    

    const item = await getItem(restaurant._id, { id: itemId }, { projection: { _id: 1, modifiers: 1, status: 1, info: 1, library: 1, id: 1, tags: 1, ingredients: 1 } });
    
    
    if(!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }
    
    const orders = await getOrders(
        restaurant._id,
        {
            "timing.ordered": { $gte: getLastWeek() /* a week */ },
            items: { $elemMatch: { itemId: item._id } }
        },
        { projection: { items: { itemId: 1 }, timing: { ordered: 1 } } }
    ).toArray();


    const convertedItem = {
        name: item.info.name,
        description: item.info.description,
        id: item.id,
        price: item.info.price,
        _id: item._id,
        status: item.status,
        library: item.library,
        tags: item.tags ? getTags(item.tags) : null,
        ingredients: item.ingredients ? getIngredients(item.ingredients) : null,
        modifiers: getModifiers(),
    };

    const collections = [];


    for(let c of restaurant.collections) {
        for(let id of c.items) {
            if(id.equals(item._id)) {
                collections.push({
                    ...c,
                    image: c.image?.buffer as any,
                });
                break;
            }
        }
    }


    const sales = [0, 0, 0, 0, 0, 0, 0];

    const current = new Date();
    for(let order of orders) {
        const date = new Date(order.timing.ordered!);

        for(let orderItem of order.items) {
            if(orderItem.itemId.equals(item._id)) {
                const index = date.getDay() - current.getDay();

                if(index > 0) {
                    sales[+index - 1]++;
                } else {
                    sales[index + 6]++;
                }

            }
        }
    }

    


    res.send({ item: convertedItem, collections, sales: { data: sales, start: new Date().getDay(), growth: getAverageSales() } });

});
router.get("/:itemId/edit", logged(), restaurantWorker({ }, { items: { adding: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { itemId } = req.params;


    const item = await getItem(
        restaurant._id,
        { id: itemId },
        { projection: { info: { name: 1, price: 1, description: 1, }, id: 1, ingredients: 1, library: 1 } },
    );

    if(!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }


    const result: {
        name: string;
        price: number;
        description: string;
        _id: ObjectId;
        id: string;
        ingredients: { amount: number; id: string; title: string; }[];
    
        image: any;
    } = {
        name: item.info.name,
        description: item.info.description,
        price: item.info.price,
        id: item.id,
        _id: item._id,
        ingredients: getIngredients(item.ingredients),
        image: item.library?.original,
    }


    res.send(result);
});
router.put("/:itemId", logged(), restaurantWorker({}, { items: { adding: true } }), async (req, res) => {
    const { itemId } = req.params; // object id here
    const { restaurant, user } = res.locals as Locals;
    const { name, price, ingredients, image, description, tags, } = req.body;


    if(!name || !price || typeof price != "number" || typeof name != "string" || price < 100) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    const getAverageTimeCooking = async () => {
        const orders = await getOrders(
            restaurant._id,
            { items: { $elemMatch: { itemId: id(itemId) } } },
            { projection: { items: { itemId: 1, timing: { taken: 1, cooked: 1 } } } }
        ).toArray();

        if(!orders || orders.length == 0) {
            return null;
        }

        let amountOfItems = 0;
        let totalTimeCooking = 0;
        for(const session of orders) {
            for(const item of session.items) {
                if(item.itemId.equals(itemId)) {
                    if(!item.timing?.cooked || !item.timing.taken) {
                        continue;
                    }

                    const time = item.timing.cooked - item.timing.taken;

                    amountOfItems++;
                    totalTimeCooking += time;
                }
            }
        }

        const avgTime = Math.ceil(totalTimeCooking / amountOfItems);;

        if(avgTime < 10000) {
            return null;
        }

        return avgTime;
    }

    const update: any = {
        "info.name": name,
        "info.price": price,
        "info.description": description,
        "info.averageTime": await getAverageTimeCooking(),
        id: name.replace(/[^\w\s]/gi, "").replace(/\s/g, "-").toLowerCase(),
    };

    const push: any = {};

    if(ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
        update.ingredients = [];
        for(let ing of ingredients) {
            if(ing.id && ing.amount && ing.amount > 0) {
                update.ingredients.push({
                    id: ing.id,
                    amount: ing.amount,
                });
            }
        }
    }

    if(tags && Array.isArray(tags) && tags.length > 0) {
        update.tags = [];
        for(let tag of tags) {
            if(tag.id) {
                update.tags.push(tag.id);
            }
        }
    }

    
    if(image && image.base64 && image.resolution && typeof image.resolution == "number") {
        update["library.userId"] = user._id;
        push["library.list"] = {
            buffer: bufferFromString(image.base64),
            resolution: image.resolution,
        }
    }

    
    const result = await updateItem(restaurant._id, { _id: id(itemId) }, { $set: update, }, { projection: { _id: 1, } });


    res.send({ updated: result.ok == 1, newId: update["id"] });
});
router.put("/:itemId/collections", logged(), restaurantWorker({ collections: 1 }, { items: { adding: true, }, collections: { adding: true } }), async (req, res) => {
    const { itemId } = req.params;
    const { restaurant } = res.locals as Locals;
    const { collections } = req.body;


    if(!collections || !Array.isArray(collections)) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    if(!restaurant.collections || restaurant.collections.length == 0) {
        return res.status(400).send({ reason: "NoCollections" });
    }

    const item = await getItem(restaurant._id, { $or: [ { _id: id(itemId) }, { id: itemId } ] }, { projection: { _id: 1 } });

    if(!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }

    const removeFromCollectionsIds: ObjectId[] = [];
    const addToCollectionsIds: ObjectId[] = [];

    for(let collection of restaurant.collections) {
        let remove = true;
        for(let id of collections) {
            if(collection._id.equals(id)) {
                addToCollectionsIds.push(collection._id);
                remove = false;
            }
        }
        if(remove) {
            removeFromCollectionsIds.push(collection._id);
        }
    }


    const update = await updateRestaurant({ _id: restaurant._id }, {
        $pull: {
            "collections.$[removeFrom].items": item._id
        },
        $addToSet: {
            "collections.$[addTo].items": item._id
        }
    }, { arrayFilters: [ { "removeFrom._id": { $in: removeFromCollectionsIds } }, { "addTo._id": { $in: addToCollectionsIds } } ] });


    
    res.send({ updated: update.ok == 1 });
});
router.put("/:itemId/visibility", logged(), restaurantWorker({ }, { items: { adding: true } }), async (req, res) => {
    const { itemId } = req.params;
    const { value } = req.body;
    const { restaurant } = res.locals as Locals;

    if(typeof value != "boolean") {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    const update = await updateItem(
        restaurant._id,
        { id: itemId },
        { $set: { status: value ? "visible" : "hidden" } },
        { projection: { _id: 1 } },
    );



    res.send({ updated: update.ok == 1 });
});
router.get("/:itemId/image", async (req, res) => {
    const { itemId, restaurantId } = req.params as any;

    const item = await getItem(restaurantId, { id: itemId }, { projection: { library: { preview: 1, } } });

    if(!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }

    if(!item.library || !item.library.preview) {
        return res.send(null);
    }

    const image = item.library.preview;

    res.set("Content-Type", "image/png");
    res.set("Content-Length", image.buffer.length.toString());
    res.set("Cache-Control", "public, max-age=31536000");
    res.send(image.buffer);
});






router.post("/:itemId/modifier", logged(), restaurantWorker({ }, { items: { adding: true } }), async (req, res) => {
    const { itemId } = req.params;
    const { modifier } = <{ modifier: Modifier }>req.body;
    const { restaurant } = res.locals as Locals;

    if(!modifier) {
        return res.status(400).send({ reason: "ModifierNotProvided" });
    }

    const wrongName = !modifier.name || modifier.name.length < 2;
    const wrongAmountOptions = !modifier.amountToSelect || !["less", "more", "one"].includes(modifier.amountToSelect);
    const shouldntBeLessThan2IfLess = (modifier.amountToSelect == "less" && modifier.amountOfOptions < 2);
    const shouldntBeMoreThanOptionsIfMore = (modifier.amountToSelect == "more" && modifier.amountOfOptions >= modifier.options.length);
    const shouldBeOneIfOne = (modifier.amountToSelect == "one" && modifier.amountOfOptions != 1);
    const wrongOptionsAmount = !modifier.amountOfOptions || modifier.amountOfOptions < 1 || shouldntBeLessThan2IfLess || shouldntBeMoreThanOptionsIfMore;
    const wrongRequired = typeof modifier.required != "boolean";
    const wrongOptions = !modifier.options || modifier.options.length < 2;

    if(wrongName || wrongAmountOptions || wrongOptionsAmount || wrongOptions || shouldBeOneIfOne || wrongRequired) {
        return res.status(400).send({ reason: "InvalidModifier" });
    }
    for(const option of modifier.options) {
        if(!option.name || option.name.length < 2 || (option.price && typeof option.price != "number")) {
            return res.status(400).send({ reason: "InvalidModifier" });
        }
        if(option.price) {
            option.price = Math.floor(option.price * 100);
        }
        option._id = id();
    }

    modifier._id = id();

    const update = await updateItem(restaurant._id, { id: itemId }, { $push: { modifiers: modifier } }, { projection: {} });


    const getSelectTitle = () => {
        if(modifier.amountToSelect == "more") {
            return `More than ${modifier.amountOfOptions} options`;
        } else if(modifier.amountToSelect == "less") {
            return `Up to ${modifier.amountOfOptions} options`;
        } else if(modifier.amountToSelect == "one") {
            return "Just one";
        }
    }

    res.send({ updated: update.ok == 1, modifier: {...modifier, toSelectTitle: getSelectTitle() } });
});
router.put("/:itemId/modifier", logged(), restaurantWorker({ }, { items: { adding: true } }), async (req, res) => {
    const { itemId } = req.params;
    const { modifier } = <{ modifier: Modifier }>req.body;
    const { restaurant } = res.locals as Locals;

    if(!modifier) {
        return res.status(400).send({ reason: "ModifierNotProvided" });
    }
    
    if(!modifier._id) {
        return res.status(400).send({ reason: "NoModifierId" });
    }

    const wrongName = !modifier.name || modifier.name.length < 2;
    const wrongAmountOptions = !modifier.amountToSelect || !["less", "more", "one"].includes(modifier.amountToSelect);
    const shouldntBeLessThan2IfLess = (modifier.amountToSelect == "less" && modifier.amountOfOptions < 2);
    const shouldntBeMoreThanOptionsIfMore = (modifier.amountToSelect == "more" && modifier.amountOfOptions >= modifier.options.length);
    const shouldBeOneIfOne = (modifier.amountToSelect == "one" && modifier.amountOfOptions != 1);
    const shouldntBeEqualIfMoreThanOptionsLength = (modifier.amountToSelect == "more" && modifier.amountOfOptions > modifier.options.length);
    const wrongOptionsAmount = !modifier.amountOfOptions || modifier.amountOfOptions < 1 || shouldntBeLessThan2IfLess || shouldntBeMoreThanOptionsIfMore;
    const wrongRequired = typeof modifier.required != "boolean";
    const wrongOptions = !modifier.options || modifier.options.length < 2;

    if(wrongName || wrongAmountOptions || wrongOptionsAmount || shouldntBeEqualIfMoreThanOptionsLength || wrongOptions || shouldBeOneIfOne || wrongRequired) {
        return res.status(400).send({ reason: "InvalidModifier" });
    }
    for(const option of modifier.options) {
        if(!option.name || option.name.length < 2 || (option.price && typeof option.price != "number")) {
            return res.status(400).send({ reason: "InvalidModifier" });
        }
        if(option.price) {
            option.price = Math.floor(option.price * 100);
        }

        if(option._id) {
            option._id = id(option._id);
        } else {
            option._id = id();
        }

    }

    modifier._id = id(modifier._id);

    const update = await updateItem(
        restaurant._id,
        { id: itemId },
        { $set: { "modifiers.$[modifier]": modifier } },
        { projection: { _id: 1 }, arrayFilters: [{ "modifier._id": modifier._id, }] }
    );


    const getSelectTitle = () => {
        if(modifier.amountToSelect == "more") {
            return `More than ${modifier.amountOfOptions} options`;
        } else if(modifier.amountToSelect == "less") {
            return `Up to ${modifier.amountOfOptions} options`;
        } else if(modifier.amountToSelect == "one") {
            return "Just one";
        }
    }

    res.send({ updated: update.ok == 1, modifier: {...modifier, options: modifier.options.map(o => { return { ...o, price: o.price / 100 } }), toSelectTitle: getSelectTitle() } });
});
router.delete("/:itemId/modifier/:modifierId", logged(), restaurantWorker({ }, { items: { adding: true } }), async (req, res) => {
    const { itemId, modifierId } = req.params;
    const { restaurant } = res.locals as Locals;

    if(modifierId.length != 24) {
        return res.status(400).send({ reason: "InvalidModifierId" });
    }

    const update = await updateItem(
        restaurant._id,
        { id: itemId },
        { $pull: { modifiers: { _id: id(modifierId) } } },
        { projection: { _id: 1 } },
    );

    res.send({ updated: update.ok == 1 });
});









router.delete("/:itemId", logged(), restaurantWorker({ }, { items: { removing: true } }), async (req, res) => {
    const { itemId } = req.params; // OBJECT ID HERE
    const { restaurant } = res.locals as Locals;

    if(!itemId || itemId.length != 24) {
        return res.status(400).send({ reason: "InvalidItemId" });
    }

    const item = await getItem(restaurant._id, { _id: id(itemId) }, { projection: { info: { name: 1, price: 1 } } });

    if(!item) {
        return res.status(404).send({ reason: "ItemNotFound" });
    }

    const ordersUpdate = await updateOrders(
        restaurant._id,
        { items: { $elemMatch: { itemId: id(itemId) } } },
        { $set: {
            "items.$[item].info.price": item.info.price,
            "items.$[item].info.name": item.info.name,
        } },
        { arrayFilters: [ { "item.itemId": id(itemId) } ] }
    );

    const collectionsUpdate = await updateRestaurant(
        { _id: restaurant._id, collections: { $elemMatch: { items: { $in: [id(itemId)] } } } },
        { $pull: { "collections.$[collectionWithTheItem].items": id(itemId) } },
        { projection: { _id: 1 }, arrayFilters: [ { "collectionWithTheItem.items": { $in: [id(itemId)] } } ] },
    );

    console.log("collections updated: ", collectionsUpdate.ok == 1);
    console.log("orders      updated: ", ordersUpdate.modifiedCount > 0);

    const deleted = await deleteItem(restaurant._id, id(itemId));

    res.send({ updated: deleted.deletedCount > 0 });
});









export {
    router as ItemsRouter,
}