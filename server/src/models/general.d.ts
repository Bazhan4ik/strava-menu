import { Restaurant } from "./restaurant.js";
import { Session } from "./session.js";
import { User } from "./user.js";
import { ObjectId } from "mongodb";

interface Locals {
    user: User;
    restaurant: Restaurant;
    session: Session;
    location: ObjectId;
}



export {
    Locals,
}