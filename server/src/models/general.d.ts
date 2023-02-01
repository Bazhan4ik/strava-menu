import { Restaurant } from "./restaurant.js";
import { Order } from "./session.js";
import { User } from "./user.js";

interface Locals {
    user: User;
    restaurant: Restaurant;
    session: Order;
}



export {
    Locals,
}