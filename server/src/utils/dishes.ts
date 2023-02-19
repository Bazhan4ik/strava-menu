import { Filter, FindOneAndUpdateOptions, FindOptions, ObjectId, UpdateFilter } from "mongodb";
import { dishesDBName } from "../config.js";
import { Dish } from "../models/dish.js";
import { client } from "../setup/mongodb.js";


async function addDish(restaurantId: ObjectId, userId: ObjectId, dish: Dish) {
    try {
        
        const result = await client.db(dishesDBName).collection(restaurantId.toString()).insertOne(dish);

        return result.acknowledged;
    } catch (e) {
        console.error("at addDish()");
        throw e;
    }
}

function getDishes(restaurantId: ObjectId, filter: Filter<Dish>, options: FindOptions<Dish>) {
    try {
        
        const result = client.db(dishesDBName).collection<Dish>(restaurantId.toString()).find(filter, options);


        return result;
    } catch (e) {
        console.error("at getDishes()");
        throw e;
    }
}

async function getDish(restaurantId: ObjectId, filter: Filter<Dish>, options: FindOptions<Dish>): Promise<Dish | null> {
    try {
        const result = await client.db(dishesDBName).collection<Dish>(restaurantId.toString()).findOne(filter, options);

        return result;
    } catch (e) {
        console.error("at getDish()");
        throw e;
    }
}

async function updateDish(restaurantId: ObjectId, filter: Filter<Dish>, update: UpdateFilter<Dish>, options: FindOneAndUpdateOptions) {
    try {
        
        const result = await client.db(dishesDBName).collection<Dish>(restaurantId.toString()).findOneAndUpdate(filter, update, options);

        return {
            dish: result.value,
            ok: result.ok,
        }
    } catch (e) {
        console.error("at updateDish()");
        throw e;
    }
}

async function deleteDish(restaurantId: ObjectId, dishId: ObjectId) {
    try {
        
        return await client.db(dishesDBName).collection(restaurantId.toString()).deleteOne({ _id: dishId });

    } catch (e) {
        console.error("at deleteDish()");
        throw e;
    }
}


export {
    addDish,
    getDishes,
    getDish,
    updateDish,
    deleteDish,
}