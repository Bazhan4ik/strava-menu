import { Router } from "express";
import { ObjectId } from "mongodb";
import sharp from "sharp";
import { Dish } from "../../../models/dish.js";
import { Locals } from "../../../models/general.js";
import { Collection } from "../../../models/restaurant.js";
import { addDish, getDish, getDishes, updateDish } from "../../../utils/dishes.js";
import { id } from "../../../utils/id.js";
import { logged } from "../../../utils/middleware/auth.js";
import { restaurantWorker } from "../../../utils/middleware/restaurant.js";
import { bufferFromString } from "../../../utils/other/bufferFromString.js";
import { getIngredients } from "../../../utils/other/ingredients.js";
import { getTags } from "../../../utils/other/tags.js";
import { updateRestaurant } from "../../../utils/restaurant.js";



const router = Router({ mergeParams: true });




router.post("/", logged(), restaurantWorker({}, { restaurant: { dishes: { adding: true } } }), async (req, res) => {
    const { name, price, description, tags, ingredients, image } = req.body;
    const { restaurant, user } = res.locals as Locals;
    console.log(req.body);

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
        
        library: null!,
        id: name.replace(/[^\w\s]/gi, "").replace(/\s/g, "-").toLowerCase(),
        _id: id(),
        ingredients: null!,
        tags: null!,
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

            newDish.library = {
                preview: preview,
                modified: Date.now(),
                userId: user._id,
                list: [
                    {
                        buffer: buffer,
                        resolution,
                    },
                ]
            };
        }
    }


    console.log(newDish);



    const result = await addDish(restaurant._id, user._id, newDish);



    res.send({
        updated: result,
    });
});
router.get("/", logged(), restaurantWorker({}, { restaurant: { dishes: { available: true } } }), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;


    const dishes = await getDishes(restaurant._id, { }, { projection: { info: { name: 1, price: 1 }, id: 1, library: { preview: 1, } } }).toArray();

    const result: {
        name: string;
        price: number;
        image: any;
        id: string;
        _id: ObjectId;
    }[] = [];

    for(let dish of dishes) {
        result.push({
            name: dish.info.name,
            price: dish.info.price,
            id: dish.id,
            image: dish.library.preview,
            _id: dish._id,
        });
    }


    res.send(result);
});
router.get("/:dishId", logged(), restaurantWorker({}, { restaurant: { dishes: { available: true } } }), async (req, res) => {
    const { dishId } = req.params;
    const { restaurant } = res.locals as Locals;

    if(!dishId) {
        return res.status(404).send({ reason: "DishIdNotProvided" });
    }
    

    const dish = await getDish(restaurant._id, { id: dishId }, { projection: { info: 1, library: 1, id: 1, tags: 1, ingredients: 1 } });


    if(!dish) {
        return res.status(404).send({ reason: "NoDishFound" });
    }



    const returnDish = {
        name: dish.info.name,
        description: dish.info.description,
        id: dish.id,
        price: dish.info.price,
        _id: dish._id,
        library: dish.library,
        tags: dish.tags ? getTags(dish.tags) : null,
        ingredients: dish.ingredients ? getIngredients(dish.ingredients) : null,
    };




    res.send(returnDish);

});
router.put("/:dishId", logged(), restaurantWorker({}, { restaurant: { dishes: { adding: true } } }), async (req, res) => {
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
router.get("/:dishId/collections", logged(), restaurantWorker({ collections: 1 }, { restaurant: { dishes: { available: true } } }), async (req, res) => {
    const { dishId } = req.params;
    const { restaurant } = res.locals as Locals;

    if(!restaurant.collections || restaurant.collections.length == 0) {
        return res.send([]);
    }

    const dish = await getDish(restaurant._id, { $or: [ { _id: id(dishId) }, { id: dishId } ] }, { projection: { _id: 1 } });

    if(!dish) {
        return res.status(404).send({ reason: "DishNotFound" });
    }

    const collections: Collection[] = [];

    for(let c of restaurant.collections) {
        for(let id of c.dishes) {
            if(id.equals(dish._id)) {
                collections.push({
                    ...c,
                    image: c.image.buffer as any,
                });
                break;
            }
        }
    }

    res.send(collections);
});
router.put("/:dishId/collections", logged(), restaurantWorker({ collections: 1 }, { restaurant: { dishes: { adding: true, }, collections: { adding: true } } }), async (req, res) => {
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










export {
    router as DishesRouter,
}