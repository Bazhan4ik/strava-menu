import { Router } from "express";
import { ObjectId } from "mongodb";
import { DEFAULT_COLLECTIONS_IDS } from "../../../resources/data/collections.js";
import { Locals } from "../../models/general.js";
import { Collection } from "../../models/restaurant.js";
import { getDish, getDishes } from "../../utils/dishes.js";
import { customerRestaurant } from "../../utils/middleware/customRestaurant.js";
import { SessionRouter } from "./session.js";




const projections = {
    customerDishes: {
        id: 1,
        _id: 1,
        info: {
            name: 1,
            price: 1,
        },
        library: 1,
    },
    customerDish: {
        id: 1,
        info: {
            name: 1,
            price: 1,
            description: 1,
        },
        library: 1,
    }
}




const router = Router({ mergeParams: true });


router.use("/session", SessionRouter);


router.get("/locations", customerRestaurant({ locations: 1, info: { name: 1, id: 1, } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;



    if(!restaurant.locations || restaurant.locations.length == 0) {
        return res.status(403).send({ reason: "NoLocations" });
    }

    const locations = [];

    for(let location of restaurant.locations!) {
        locations.push({
            name: location.name,
            addressLine1: location.line1,
            addressLine2: location.line2,
            city: location.city,
            id: location.id,
        });
    }


    res.send({
        locations,
        restaurant: {
            name: restaurant.info.name,
            id: restaurant.info.id
        }
    });
});

router.get("/dishes", customerRestaurant({ _id: 1, collections: 1 }), async (req, res) => {
    const { restaurant } = res.locals as Locals;


    const dishes = await getDishes(restaurant._id, { }, { projection: projections.customerDishes }).toArray();

    const convertedDishes: { price: number; _id: ObjectId; name: string; id: string; image: any; }[] = [];
    for(let dish of dishes) {
        convertedDishes.push({
            name: dish.info.name,
            price: dish.info.price,
            id: dish.id,
            image: dish.library?.list[0],
            _id: dish._id,
        });
    }

    const filterDishes = (ids: ObjectId[]) => {
        const result = [];
        for(let dish of convertedDishes) {
            for(let id of ids) {
                if(dish._id.equals(id)) {
                    result.push(dish)
                    break;
                }
            }
        }
        return result;
    }


    const result: {
        title: string;
        dishes: { price: number; name: string; id: string; image: any; }[];
        id: string;
        redirectable: boolean;
    }[] = [ ];

    for(let collection of restaurant.collections) {
        if(!DEFAULT_COLLECTIONS_IDS.includes(collection.id)) {
            result.push({
                title: collection.name,
                id: collection.id,
                redirectable: collection.dishes.length > 5,
                dishes: filterDishes(collection.dishes),
            });
        }
    }

    console.log(result);

    res.send(result);
});

router.get("/dishes/:dishId", customerRestaurant({ collections: 1, }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { dishId } = req.params;
    const { c } = req.query;

    const dish = await getDish(restaurant._id, { id: dishId }, { projection: projections.customerDish });

    if(!dish) {
        return res.status(404).send({ reason: "DishNotFound" });
    }

    const result: any = {
        dish: {
            name: dish.info.name,
            price: dish.info.price,
            description: dish.info.description,
            images: dish.library.list,
            _id: dish._id,
        }
    }
    
    if(c && typeof c == "string") {
        let collection: Collection = null!;

        

        for(let coll of restaurant.collections) {
            if(coll.id == c) {
                collection = coll;
                break;
            }
        }

        if(collection) {
            const dishes = await getDishes(restaurant._id, { _id: { $in: collection.dishes, $ne: dish._id, } }, { projection: projections.customerDishes }).toArray();

            const convertedDishes = [];

            for(let dish of dishes) {
                if(convertedDishes.length == 5) {
                    break;
                }
                convertedDishes.push({
                    name: dish.info.name,
                    price: dish.info.price,
                    id: dish.id,
                    image: dish.library?.list[0],
                    _id: dish._id,
                });
            }

            result.collection = {
                dishes: convertedDishes,
                title: collection.name,
                id: collection.id,
                redirectable: dishes.length > 5
            };
        }
        
    }


    


    res.send(result);
});




export {
    router as CustomerRouter,
}