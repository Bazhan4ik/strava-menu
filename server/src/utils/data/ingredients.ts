import { ObjectId } from "mongodb";
import { ingredients } from "../../../resources/data/ingredients.js";
import { Ingredient } from "../../models/item.js";
import { Ingredients } from "../../models/restaurant.js";
import { getItem } from "./items.js";
import { updateRestaurant } from "./restaurant.js";

function getIngredients(parse: Ingredient[]) {
    const result = [];

    for(let category of Object.keys(ingredients)) {
        for(let ingredient of ingredients[category]) {
            for(let i of parse) {
                if(i.id == ingredient.id) {
                    result.push({
                        id: i.id,
                        title: ingredient.title,
                        amount: i.amount,
                    });

                    if(result.length == parse.length) {
                        return result;
                    }
                    
                    break;
                }
            }
        }
    }

    return result;
    
}

async function updateIngredientsUsage(restaurantId: ObjectId, itemId: ObjectId) {
    try {
        
        const item = await getItem(restaurantId, { _id: itemId }, { projection: { ingredients: 1 } });

        if(!item || !item.ingredients || item.ingredients.length == 0) {
            return;
        }

        const $inc: any = {};
        const arrayFilters: any[] = [];

        for(let i in item.ingredients) {
            const ingredient = item.ingredients[i];

            $inc[`ingredients.current.$[ingredient${i}].amount`] = ingredient.amount;
            arrayFilters.push({ });
            arrayFilters[i][`ingredient${i}.id`] = ingredient.id;
        }

        const update = await updateRestaurant({ _id: restaurantId }, { $inc }, { arrayFilters });

        console.log("INGREDIENTS USAGE UPDATED: ", update.ok == 1);


        return update.ok == 1;
        
    } catch (e) {
        console.error(e);
    }
}


function getEmptyIngredients(): Ingredients.Usage[] {
    const result: Ingredients.Usage[] = [];

    for(let category of Object.keys(ingredients)) {
        for(let ingredient of ingredients[category]) {
            result.push({
                id: ingredient.id,
                amount: 0,
            });
        }
    }


    return result;
}


export {
    getIngredients,
    updateIngredientsUsage,
    getEmptyIngredients,
}