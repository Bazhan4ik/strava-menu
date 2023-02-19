import { Router } from "express";
import { ingredients } from "../../../resources/data/ingredients.js";
import { Ingredient } from "../../models/dish.js";
import { Locals } from "../../models/general.js";
import { logged } from "../../utils/middleware/auth.js";
import { restaurantWorker } from "../../utils/middleware/restaurant.js";
import { bulkRestaurant, updateRestaurant } from "../../utils/restaurant.js";



const router = Router({ mergeParams: true });




router.get("/", logged(), restaurantWorker({ ingredients: { current: 1, prices: 1, } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;

    if(!restaurant.ingredients || !restaurant.ingredients.current || !restaurant.ingredients.prices) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    
    const result: { name: string; amount: number; id: string; price: number; }[] = [];


    const getIngredient = (id: string) => {
        for(let category of Object.keys(ingredients)) {
            for(let ing of ingredients[category]) {
                if(ing.id == id) {
                    return ing;
                }
            }
        }

        return null!;
    }
    const getIngredientPrice = (id: string) => {
        for(let ingp of restaurant.ingredients.prices) {
            if(ingp.id == id) {
                return ingp.price
            }
        }
        return null!;
    }

    for(let ingredient of restaurant.ingredients.current) {
        if(ingredient.amount < 1) {
            continue;
        }

        const info = getIngredient(ingredient.id);

        if(!info) {
            continue;
        }



        result.push({
            name: info.title,
            id: ingredient.id,
            amount: ingredient.amount,
            price: getIngredientPrice(ingredient.id),
        });
    }


    res.send({ ingredients: result });
});

router.get("/:ingredientId", logged(), restaurantWorker({ ingredients: { current: 1, prices: 1, } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { ingredientId } = req.params;

    if(!ingredientId) {
        return res.status(400).send({ reason: "NoIngredientId" });
    }
    if(!restaurant.ingredients || !restaurant.ingredients.current || !restaurant.ingredients.prices) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getIngredientInfo = () => {
        for(let category of Object.keys(ingredients)) {
            for(let ingredient of ingredients[category]) {
                if(ingredient.id == ingredientId) {
                    return ingredient;
                }
            }
        }
        return null!;
    }
    const getIngredientUsage = () => {
        for(let ingredient of restaurant.ingredients.current) {
            if(ingredient.id == ingredientId) {
                return ingredient;
            }
        }
        return null!;
    }
    const getIngredientPrice = () => {
        for(let ingp of restaurant.ingredients.prices) {
            if(ingp.id == ingredientId) {
                return ingp.price;
            }
        }
        return null!;
    }

    const ingredientInfo = getIngredientInfo();
    const ingredientUsage = getIngredientUsage();

    if(!ingredientInfo || !ingredientUsage) {
        return res.status(404).send({ reason: "IngredientNotFound" });
    }


    const result: {
        name: string;
        amount: number;
        price: number;
        id: string;
    } = {
        name: ingredientInfo.title,
        id: ingredientInfo.id,
        amount: ingredientUsage.amount,
        price: getIngredientPrice(),
    };






    res.send(result);
});

router.put("/:ingredientId/price", logged(), restaurantWorker({ }), async (req, res) => {
    const { ingredientId } = req.params;
    const { restaurant } = res.locals as Locals;
    const { price } = req.body;

    if(!ingredientId) {
        return res.status(400).send({ reason: "NoIngredientId" });
    }
    if(!price || typeof price != "number" || price < 1) {
        return res.status(400).send({ reason: "InvalidPrice" });
    }

    const update = await bulkRestaurant([
        {
            updateOne: {
                filter: {
                    _id: restaurant._id,
                    "ingredients.prices.id": ingredientId
                },
                update: {
                    $set: {
                        "ingredients.prices.$.price": price * 100
                    }
                }
            }
        },
        {
            updateOne: {
                filter: { _id: restaurant._id },
                update: {
                    $addToSet: {
                        "ingredients.prices": {
                            price: price * 100,
                            id: ingredientId
                        }
                    }
                },
                upsert: true
            }
        }        
    ]);
    

    res.send({ updated: update.ok == 1 });
});





export {
    router as IngredientsRouter,
}