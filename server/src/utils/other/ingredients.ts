import { ingredients } from "../../../resources/data/ingredients.js";
import { Ingredient } from "../../models/dish.js";

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


export {
    getIngredients
}