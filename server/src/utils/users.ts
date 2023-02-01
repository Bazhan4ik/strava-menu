import { mainDBName } from "../config.js";
import { User } from "../models/user.js";
import { client } from "../setup/mongodb.js";
import { Filter, FindOneAndUpdateOptions, FindOptions, UpdateFilter } from "mongodb";
import { truncateSync } from "fs";



async function addUser(user: User) {
    try {
        
        const result = await client.db(mainDBName).collection("users").insertOne(user);

        return result.insertedId;

    } catch (e) {
        console.error("at addUser");
        throw e;   
    }
}

async function getUser(filter: Filter<User>, options: FindOptions<User>): Promise<User> {
    try {
        const result = await client.db(mainDBName).collection("users").findOne(filter, options);

        return result as User;
    } catch (e) {
        console.error("at getUser");
        throw e;
    }
}


async function updateUser(filter: Filter<User>, update: UpdateFilter<User>, options: FindOneAndUpdateOptions) {
    try {
        const result = await client.db(mainDBName).collection<User>("users").findOneAndUpdate(filter, update, options);

        return {
            user: result.value,
            ok: result.ok,
        }
    } catch (error) {
        console.error("at updateUser");
        throw error;
    }
}


export {
    addUser,
    getUser,
    updateUser
}





















