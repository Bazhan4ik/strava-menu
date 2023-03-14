import { Router } from "express";
import { ObjectId } from "mongodb";
import sharp from "sharp";
import { Dish, Modifier } from "../../../models/dish.js";
import { Locals } from "../../../models/general.js";
import { Collection } from "../../../models/restaurant.js";
import { addDish, deleteDish, getDish, getDishes, updateDish } from "../../../utils/dishes.js";
import { id } from "../../../utils/id.js";
import { logged } from "../../../utils/middleware/auth.js";
import { restaurantWorker } from "../../../utils/middleware/restaurant.js";
import { bufferFromString } from "../../../utils/bufferFromString.js";
import { getIngredients } from "../../../utils/ingredients.js";
import { getTags } from "../../../utils/tags.js";
import { updateRestaurant } from "../../../utils/restaurant.js";
import { getOrders, updateOrders } from "../../../utils/orders.js";



const router = Router({ mergeParams: true });




router.post("/", logged(), restaurantWorker({}, { dishes: { adding: true } }), async (req, res) => {
    const { name, price, description, tags, ingredients, image } = req.body;
    const { restaurant, user } = res.locals as Locals;

    if(!name || !price) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    if(price < 100) {
        return res.status(422).send({ reason: "InvalidPrice" });
    }
    
    
    const newDish: Dish = {
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
    

    if(tags) {
        newDish.tags = [];
        for(let tag of tags) {
            if(tag.id) {
                newDish.tags.push(tag.id);
            }
        }
    }


    if(ingredients) {
        newDish.ingredients = [];
        for(let ing of ingredients) {
            if(ing.id && ing.amount && ing.amount > 0) {
                newDish.ingredients.push({
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

            newDish.library = {
                preview: preview as any,
                blur: blur as any,
                modified: Date.now(),
                userId: user._id,
                original: original as any,
            };
        }
    }


    const result = await addDish(restaurant._id, user._id, newDish);



    res.send({
        updated: result,
    });
});
router.get("/", logged(), restaurantWorker({}, { dishes: { available: true } }), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;


    const dishes = await getDishes(restaurant._id, { }, { projection: { status: 1, info: { name: 1, price: 1 }, id: 1, library: { preview: 1, } } }).toArray();

    const result: {
        name: string;
        price: number;
        image: any;
        id: string;
        _id: ObjectId;
        status: string;
    }[] = [];

    for(let dish of dishes) {
        result.push({
            name: dish.info.name,
            price: dish.info.price,
            id: dish.id,
            image: dish.library?.preview,
            _id: dish._id,
            status: dish.status,
        });
    }


    res.send(result);
});
router.get("/:dishId", logged(), restaurantWorker({ collections: { name: 1, image: 1, _id: 1, dishes: 1, id: 1, }, }, { dishes: { available: true } }), async (req, res) => {
    const { dishId } = req.params;
    const { restaurant } = res.locals as Locals;

    if(!restaurant.collections) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(!dishId) {
        return res.status(404).send({ reason: "DishIdNotProvided" });
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

        if(!dish?.modifiers) {
            return [];
        }

        
        const result = [];
        for(const modifier of dish!.modifiers) {
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
        // date of last week's day but random time
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
    

    const dish = await getDish(restaurant._id, { id: dishId }, { projection: { _id: 1, modifiers: 1, status: 1, info: 1, library: 1, id: 1, tags: 1, ingredients: 1 } });
    
    
    if(!dish) {
        return res.status(404).send({ reason: "NoDishFound" });
    }
    
    const orders = await getOrders(
        restaurant._id,
        {
            "timing.ordered": { $gte: getLastWeek() /* a week */ },
            dishes: { $elemMatch: { dishId: dish._id } }
        },
        { projection: { dishes: { dishId: 1 }, timing: { ordered: 1 } } }
    ).toArray();


    const convertedDish = {
        name: dish.info.name,
        description: dish.info.description,
        id: dish.id,
        price: dish.info.price,
        _id: dish._id,
        status: dish.status,
        library: dish.library,
        tags: dish.tags ? getTags(dish.tags) : null,
        ingredients: dish.ingredients ? getIngredients(dish.ingredients) : null,
        modifiers: getModifiers(),
    };

    const collections = [];


    for(let c of restaurant.collections) {
        for(let id of c.dishes) {
            if(id.equals(dish._id)) {
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

        for(let orderDish of order.dishes) {
            if(orderDish.dishId.equals(dish._id)) {
                const index = date.getDay() - current.getDay();

                if(index > 0) {
                    sales[+index - 1]++;
                } else {
                    sales[index + 6]++;
                }

            }
        }
    }

    


    res.send({ dish: convertedDish, collections, sales: { data: sales, start: new Date().getDay(), growth: getAverageSales() } });

});
router.get("/:dishId/edit", logged(), restaurantWorker({ }, { dishes: { adding: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { dishId } = req.params;


    const dish = await getDish(
        restaurant._id,
        { id: dishId },
        { projection: { info: { name: 1, price: 1, description: 1, }, id: 1, ingredients: 1, library: 1 } },
    );

    if(!dish) {
        return res.status(404).send({ reason: "DishNotFound" });
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
        name: dish.info.name,
        description: dish.info.description,
        price: dish.info.price,
        id: dish.id,
        _id: dish._id,
        ingredients: getIngredients(dish.ingredients),
        image: dish.library?.original,
    }


    res.send(result);
});
router.put("/:dishId", logged(), restaurantWorker({}, { dishes: { adding: true } }), async (req, res) => {
    const { dishId } = req.params;
    const { restaurant, user } = res.locals as Locals;
    const { name, price, ingredients, image, description, tags, } = req.body;


    if(!name || !price || typeof price != "number" || typeof name != "string" || price < 100) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    const update: any = {
        "info.name": name,
        "info.price": price,
        "info.description": description,
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
    
    const result = await updateDish(restaurant._id, { id: dishId }, { $set: update, }, { projection: { _id: 1, } });


    res.send({ updated: result.ok == 1, newId: update["id"] });
});
router.put("/:dishId/collections", logged(), restaurantWorker({ collections: 1 }, { dishes: { adding: true, }, collections: { adding: true } }), async (req, res) => {
    const { dishId } = req.params;
    const { restaurant } = res.locals as Locals;
    const { collections } = req.body;

    console.log(collections);

    if(!collections || !Array.isArray(collections)) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    if(!restaurant.collections || restaurant.collections.length == 0) {
        return res.status(400).send({ reason: "NoCollections" });
    }

    const dish = await getDish(restaurant._id, { $or: [ { _id: id(dishId) }, { id: dishId } ] }, { projection: { _id: 1 } });

    if(!dish) {
        return res.status(404).send({ reason: "DishNotFound" });
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
            "collections.$[removeFrom].dishes": dish._id
        },
        $addToSet: {
            "collections.$[addTo].dishes": dish._id
        }
    }, { arrayFilters: [ { "removeFrom._id": { $in: removeFromCollectionsIds } }, { "addTo._id": { $in: addToCollectionsIds } } ] });


    
    res.send({ updated: update.ok == 1 });
});
router.put("/:dishId/visibility", logged(), restaurantWorker({ }, { dishes: { adding: true } }), async (req, res) => {
    const { dishId } = req.params;
    const { value } = req.body;
    const { restaurant } = res.locals as Locals;

    if(typeof value != "boolean") {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    const update = await updateDish(
        restaurant._id,
        { id: dishId },
        { $set: { status: value ? "visible" : "hidden" } },
        { projection: { _id: 1 } },
    );



    res.send({ updated: update.ok == 1 });
});






router.post("/:dishId/modifier", logged(), restaurantWorker({ }, { dishes: { adding: true } }), async (req, res) => {
    const { dishId } = req.params;
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

    const update = await updateDish(restaurant._id, { id: dishId }, { $push: { modifiers: modifier } }, { projection: {} });


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
router.put("/:dishId/modifier", logged(), restaurantWorker({ }, { dishes: { adding: true } }), async (req, res) => {
    const { dishId } = req.params;
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

    const update = await updateDish(
        restaurant._id,
        { id: dishId },
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
router.delete("/:dishId/modifier/:modifierId", logged(), restaurantWorker({ }, { dishes: { adding: true } }), async (req, res) => {
    const { dishId, modifierId } = req.params;
    const { restaurant } = res.locals as Locals;

    if(modifierId.length != 24) {
        return res.status(400).send({ reason: "InvalidModifierId" });
    }

    const update = await updateDish(
        restaurant._id,
        { id: dishId },
        { $pull: { modifiers: { _id: id(modifierId) } } },
        { projection: { _id: 1 } },
    );

    res.send({ updated: update.ok == 1 });
});









router.delete("/:dishId", logged(), restaurantWorker({ }, { dishes: { removing: true } }), async (req, res) => {
    const { dishId } = req.params; // OBJECT ID HERE
    const { restaurant } = res.locals as Locals;

    if(!dishId || dishId.length != 24) {
        return res.status(400).send({ reason: "InvalidDishId" });
    }

    const dish = await getDish(restaurant._id, { _id: id(dishId) }, { projection: { info: { name: 1, price: 1 } } });

    if(!dish) {
        return res.status(404).send({ reason: "DishNotFound" });
    }

    const ordersUpdate = await updateOrders(
        restaurant._id,
        { dishes: { $elemMatch: { dishId: id(dishId) } } },
        { $set: {
            "dishes.$[dish].info.price": dish.info.price,
            "dishes.$[dish].info.name": dish.info.name,
        } },
        { arrayFilters: [ { "dish.dishId": id(dishId) } ] }
    );

    const collectionsUpdate = await updateRestaurant(
        { _id: restaurant._id, collections: { $elemMatch: { dishes: { $in: [id(dishId)] } } } },
        { $pull: { "collections.$[collectionWithTheDish].dishes": id(dishId) } },
        { projection: { _id: 1 }, arrayFilters: [ { "collectionWithTheDish.dishes": { $in: [id(dishId)] } } ] },
    );

    console.log("collections updated: ", collectionsUpdate.ok == 1);
    console.log("orders      updated: ", ordersUpdate.modifiedCount > 0);

    const deleted = await deleteDish(restaurant._id, id(dishId));

    res.send({ updated: deleted.deletedCount > 0 });
});









export {
    router as DishesRouter,
}