import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd() + "/server/.env") });

const URI = process.env.MONGODB_URI;

if(!URI) {
    throw new Error("MONGODB URI IS NOT PROVIDED");
}

const client = new MongoClient(URI);


export {
    client
}