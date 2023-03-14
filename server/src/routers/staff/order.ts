import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { SessionDish } from "../../models/session.js";
import { getDish, getDishes } from "../../utils/dishes.js";
import { id } from "../../utils/id.js";
import { waiterManualOrder, waiterSession } from "../../utils/middleware/waiterManualOrder.js";
import { confirmSession, createSession, getSession, getSessions, updateSession } from "../../utils/sessions.js";



const router = Router({ mergeParams: true });


router.get("/", waiterManualOrder({}, { folders: 1, collections: 1 }), async (req, res) => {
    const { restaurant, user, location } = res.locals as Locals;
    const { socketId } = req.query;

    if(!socketId || typeof socketId != "string") {
        return res.status(400).send({ reason: "SocketId" });
    }

    if(!restaurant.collections || !restaurant.folders) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    let session = await getSession(
        restaurant._id,
        { "customer.by": "staff", "customer.onBehalf": user._id, status: "ordering", },
        { projection: { dishes: 1, } },
    );

    let dishesSelected = 0;
    
    if(!session) {
        session = {
            _id: id(),
            customer: {
                by: "staff",
                onBehalf: user._id,
                socketId,
            },
            dishes: [],
            info: {
                id: null!,
                type: "dinein",
                location: location
            },
            status: "ordering",
            timing: { },
            timeline: [],
            waiterRequests: [],
        };

        const update = await createSession(restaurant._id, session);

        if(!update.insertedId) {
            return res.status(500).send({ reason: "InvalidError" });
        }
    }


    const getCollection = (id: ObjectId) => {
        for(const collection of restaurant.collections) {
            if(collection._id.equals(id)) {
                dishesIds.push(...collection.dishes);
                return collection;
            }
        }
        return null!;
    }

    const dishesIds: ObjectId[] = [];
    const result = [];

    

    for(const folder of restaurant.folders) {

        if(folder.id == "other") {
            continue;
        }

        const collections = [];

        for(const c of folder.collections) {
            const collection = getCollection(c);

            if(!collection) {
                continue;
            }

            collections.push(collection);
        }

        result.push({ ...folder, collections });
    }


    const dishes = await getDishes(restaurant._id, { _id: { $in: dishesIds } }, { projection: { info: { name: 1, price: 1, }, modifiers: { _id: 1 }, id: 1, _id: 1, } }).toArray();
    const dishesMap = new Map<string, any>();
    for(const dish of dishes) {
        (dish as any).amount = 0;
        for(const sessionDish of session.dishes) {
            if(dish._id.equals(sessionDish.dishId)) {
                dishesSelected++;
                (dish as any).amount++;
            }
        }
        dishesMap.set(dish._id.toString(), {...dish, hasModifiers: !!dish.modifiers && dish.modifiers.length! > 0 });
    }

    res.send({ folders: result, dishes: Object.fromEntries(dishesMap.entries()), dishesSelected, });
});

router.post("/dish", waiterManualOrder({}, { }), waiterSession({ info: { type: 1 } }), async (req, res) => {
    const { restaurant, session } = res.locals as Locals;
    const { dishId, comment, modifiers } = req.body;

    if(!dishId || typeof dishId != "string" || dishId.length != 24 || (comment && typeof comment != "string")) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    const dish = await getDish(
        restaurant._id,
        { _id: id(dishId) },
        { projection: { modifiers: { _id: 1, required: 1, options: { _id: 1, } } } }
    );

    if(!dish) {
        return res.status(404).send({ reason: "DishNotFound" });
    }

    const dishGeneratedId = () => {

        // 3 random numbers at the end
        const rand = Math.floor(Math.random() * 900 + 100).toString();

        // either order type first letter (T | D) and 1 number of order id or first letter of last name of the customer
        const orderIndicator = "MO" + session.info.type[0].toUpperCase();

        return `${orderIndicator}-${rand}`;
    }
    const findModifier = (id: ObjectId) => {
        for(const m of modifiers) {
            if(id.equals(m._id)) {
                return m;
            }
        }
        return null!;
    }
    const checkModifiers = () => {
        const result: { _id: ObjectId; selected: ObjectId[] }[] = [];

        for(let modifierIndex = 0; modifierIndex < dish!.modifiers!.length!; modifierIndex++) {
            const modifier = dish!.modifiers![modifierIndex];

            const m = findModifier(modifier._id);

            if(!m) {
                if(modifier.required) {
                    return null;
                }
                continue;
            }

            if(!m.selected) {
                return null;
            }

            if(modifier.amountToSelect == "one") {
                if(m.selected.length != 1) {
                    return null;
                }
            } else if(modifier.amountToSelect == "more") {
                if(m.selected!.length < modifier.amountOfOptions) {
                    return null;
                }
            } else if(modifier.amountToSelect == "less") {
                if(m.selected.length > modifier.amountOfOptions) {
                    return null;
                }
            }

            const selectedOptions: ObjectId[] = [];

            for(const optionId of m.selected) {
                if(typeof optionId != "string") {
                    return null;
                }

                let found = false;
                for(const option of modifier.options) {
                    if(option._id.equals(optionId)) {
                        selectedOptions.push(option._id);
                        found = true;
                        break;
                    }
                }
                if(!found) {
                    return;
                }
            }
            result.push({ _id: modifier._id, selected: selectedOptions });
        }

        return result;
    }

    const convertedModifiers = checkModifiers();
    if(!convertedModifiers) {
        return res.status(400).send({ reason: "InvalidModifiers" });
    }


    const newDish: SessionDish = {
        _id: id(),
        dishId: id(dishId),
        modifiers: convertedModifiers,
        info: {
            comment,
            id: dishGeneratedId(),
        },
        status: "ordered",
    };

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $push: { dishes: newDish } },
        { projection: { _id: 1 } }
    );


    res.send({ updated: update.ok == 1 });
});
router.put("/dish/comment", waiterManualOrder({}, {}), waiterSession({ }), async (req, res) => {
    const { sessionDishId, comment } = req.body;
    const { restaurant, session } = res.locals as Locals;

    if(!sessionDishId || !comment || typeof sessionDishId != "string" || sessionDishId.length != 24 || typeof comment != "string") {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "dishes.$[dish].info.comment": comment } },
        { arrayFilters: [ { "dish._id": id(sessionDishId) } ], projection: { _id: 1 } }
    );


    res.send({ updated: update.ok == 1 });
});
router.delete("/dish/:sessionDishId", waiterManualOrder({}, {}), waiterSession({ dishes: { _id: 1 } }), async (req, res) => {
    const { restaurant, session } = res.locals as Locals;
    const { sessionDishId } = req.params;


    if(sessionDishId.length != 24) {
        return res.status(400).send({ reason: "InvalidId" });
    }
    if(!session.dishes) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $pull: { dishes: { _id: id(sessionDishId) } } },
        { projection: { _id: 1 } },
    );

    res.send({ updated: update.ok == 1 });
});
router.put("/dish/modifiers", waiterManualOrder({}, {}), async (req, res) => {
    const { sessionDishId, dishId } = req.query;
    const { modifiers } = req.body;
    const { restaurant } = res.locals as Locals;

    if(typeof sessionDishId != "string" || sessionDishId.length != 24) {
        return res.status(400).send({ reason: "InvalidSessionDishId" });
    }
    if(typeof dishId != "string" || dishId.length != 24) {
        return res.status(400).send({ reason: "InvalidDishId" });
    }



    const dish = await getDish(
        restaurant._id,
        { _id: id(dishId) },
        { projection: { modifiers: { _id: 1, required: 1, options: { _id: 1, } } } },
    )


    const findModifier = (id: ObjectId) => {
        for(const m of modifiers) {
            if(id.equals(m._id)) {
                return m;
            }
        }
        return null!;
    }
    const checkModifiers = () => {
        const result: { _id: ObjectId; selected: ObjectId[] }[] = [];

        for(let modifierIndex = 0; modifierIndex < dish!.modifiers!.length!; modifierIndex++) {
            const modifier = dish!.modifiers![modifierIndex];

            const m = findModifier(modifier._id);

            if(!m) {
                if(modifier.required) {
                    return null;
                }
                continue;
            }

            if(!m.selected) {
                return null;
            }

            if(modifier.amountToSelect == "one") {
                if(m.selected.length != 1) {
                    return null;
                }
            } else if(modifier.amountToSelect == "more") {
                if(m.selected!.length < modifier.amountOfOptions) {
                    return null;
                }
            } else if(modifier.amountToSelect == "less") {
                if(m.selected.length > modifier.amountOfOptions) {
                    return null;
                }
            }

            const selectedOptions: ObjectId[] = [];

            for(const optionId of m.selected) {
                if(typeof optionId != "string") {
                    return null;
                }

                let found = false;
                for(const option of modifier.options) {
                    if(option._id.equals(optionId)) {
                        selectedOptions.push(option._id);
                        found = true;
                        break;
                    }
                }
                if(!found) {
                    return;
                }
            }
            result.push({ _id: modifier._id, selected: selectedOptions });
        }

        return result;
    }

    const convertedModifiers = checkModifiers();
    if(!convertedModifiers) {
        return res.status(400).send({ reason: "InvalidModifiers" });
    }

    const update = await updateSession(
        restaurant._id,
        { dishes: { $elemMatch: { _id: id(sessionDishId) } } },
        { $set: { "dishes.$[dish].modifiers": convertedModifiers } },
        { arrayFilters: [{ "dish._id": id(sessionDishId) }], projection: { _id: 1 } },
    );

    res.send({ updated: update.ok == 1 });
});

router.get("/checkout", waiterManualOrder({}, { locations: { settings: 1, _id: 1 } }), waiterSession({ info: 1, dishes: { _id: 1, modifiers: 1, info: { comment: 1, }, dishId: 1, } }), async (req, res) => {
    const { restaurant, location, session } = res.locals as Locals;
    

    if(!restaurant.locations || !session.dishes) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getLocation = () => {
        for(const l of restaurant.locations!) {
            if(l._id.equals(location)) {
                return l;
            }
        }
        return null;
    }
    const convertDishesAndCalculateMoney = async () => {
        if(session.dishes.length == 0) {
            return { status: 400, reason: "InvalidDishes" };
        }
        const result = await calculateAmount(restaurant._id, session.dishes, session.payment?.money?.tip, restaurantLocation!.settings.serviceFee!);

        if (!result) {
            return { status: 500, reason: "InvalidDishes" };
        }
        if (!result || !result.money.total) {
            return { status: 403, reason: "InvalidAmount" };
        }
        return result;
    }


    const restaurantLocation = getLocation();
    if(!restaurantLocation) {
        return res.status(400).send({ reason: "InvalidLocation" });
    }

    const result: any = {

    }


    const calcres = await convertDishesAndCalculateMoney();
    if ((typeof (calcres as any).status == "number")) {
        return res.status((calcres as any).status || 500).send({ reason: (calcres as any).reason || "InvalidError" });
    } else {
        result.money = (calcres as any).money;
        result.dishes = (calcres as any).dishes;
    }

    result.order = {
        id: session.info?.id,
        type: session.info?.type
    }


    res.send(result);

    updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "payment.money": result.money } },
        { noResponse: true }
    );
});

router.get("/tables", waiterManualOrder({}, { tables: 1 }), async (req, res) => {
    const { location, restaurant } = res.locals as Locals;

    if(!restaurant.locations || !restaurant.tables) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const getLocationId = () => {
        for(const restaurantLocation of restaurant.locations!) {
            if(restaurantLocation._id.equals(location)) {
                return restaurantLocation.id;
            }
        }
        return null!;
    }

    const tables = restaurant.tables[getLocationId()];

    if(!tables) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const sessions = await getSessions(
        restaurant._id,
        { "info.location": location, "info.type": "dinein" },
        { projection: { info: { id: 1 } } },
    ).toArray();


    const result = [];
    for(const table of tables) {
        let taken = false;
        for(const session of sessions) {
            if(session.info?.id == table.id.toString()) {
                taken = true;
                break;
            }
        }
        result.push({
            ...table,
            taken,
        });
    }

    res.send(result);
});

router.put("/table", waiterManualOrder({}, { tables: 1 }), waiterSession({ info: 1 }), async (req, res) => {
    const { location, restaurant, session } = res.locals as Locals;
    const { tableId } = req.body;

    if(!tableId || typeof tableId != "string" || tableId.length != 24) {
        return res.status(400).send({ reason: "InvalidInput" });
    }

    if(!restaurant.locations || !restaurant.tables || !session.info) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    if(session.info.type != "dinein") {
        return res.status(403).send({ reason: "Type" });
    }

    const getLocationId = () => {
        for(const restaurantLocation of restaurant.locations!) {
            if(restaurantLocation._id.equals(location)) {
                return restaurantLocation.id;
            }
        }
        return null!;
    }
    const getTable = () => {
        for(const table of tables!) {
            if(table._id.equals(tableId)) {
                return table;
            }
        }
        return null!;
    }

    const tables = restaurant.tables[getLocationId()];

    if(!tables) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    const table = getTable();
    if(!table) {
        return res.status(404).send({ reason: "TableNotFound" });
    }

    if(table.id.toString() == session.info.id) {
        return res.send({ updated: true });
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id },
        { $set: { "info.id": table.id.toString() } },
        { projection: { _id: 1 } },
    );


    res.send({ updated: update.ok == 1 });
});


router.post("/payed", waiterManualOrder({}), waiterSession({ }), async (req, res) => {
    const { restaurant, session } = res.locals as Locals;




    const result = await confirmSession({
        restaurantId: restaurant._id,
        sessionId: session._id,
        payed: true,
    });


    res.send({ updated: result });
});

router.get("/modifiers/:dishId", waiterManualOrder({ }), async (req, res) => {
    const { dishId } = req.params;
    const { sessionDishId } = req.query;
    const { restaurant } = res.locals as Locals;

    if(dishId.length != 24) {
        return res.status(400).send({ reason: "InvalidDishId" });
    }
    if(sessionDishId && (typeof sessionDishId != "string" || sessionDishId.length != 24)) {
        return res.status(400).send({ reason: "InvalidSessionDishId" });
    }

    const dish = await getDish(
        restaurant._id,
        { _id: id(dishId) },
        { projection: { modifiers: 1 } },
    );

    if(!dish) {
        return res.status(404).send({ reason: "DishNotFound" });
    }

    const getModifierSubtitle = (o: string, a: number) => {
        if(o == "less") {
            return `Up to ${a}`;
        } else if(o == "more") {
            return `At least ${a}`;
        } else if(o == "one") {
            return null!;
        } else if(o == "equal") {
            return `Choose ${a} options`;
        }
        return null!;
    }
    const getModifiers = () => {
        const result: {
            title: string;
            subtitle: string;

            _id: ObjectId;
            required: boolean;
            toSelect: number;
            toSelectAmount: string;
        
            options: {
                name: string;
                price: number;
                _id: ObjectId;
            }[];
        }[] = [];
        for(const modifier of dish!.modifiers!) {
            result.push({
                toSelect: modifier.amountOfOptions,
                toSelectAmount: modifier.amountToSelect,
                subtitle: getModifierSubtitle(modifier.amountToSelect, modifier.amountOfOptions),
                options: modifier.options,
                required: modifier.required,
                _id: modifier._id,
                title: modifier.name,
            });
        }
        return result;
    }

    const modifiers = getModifiers();

    if(!sessionDishId) {
        return res.send({ modifiers });
    }


    const session = await getSession(
        restaurant._id,
        { dishes: { $elemMatch: { _id: id(sessionDishId) } } },
        { projection: { dishes: { _id: 1, modifiers: 1 } } }
    );

    if(!session) {
        return res.status(404).send({ reason: "SessionNotFound" });
    }

    const findDish = () => {
        for(const dish of session.dishes) {
            if(dish._id.equals(sessionDishId)) {
                return dish;
            }
        }
        return null;
    }

    const sessionDish = findDish();
    if(!sessionDish) {
        return res.status(404).send({ reason: "SessionDishNotFound" });
    }
    if(!sessionDish.modifiers) {
        return res.send({ modifiers });
    }

    for(const modifier of modifiers) {
        for(const sessionDishModifier of sessionDish.modifiers!) {
            if(modifier._id.equals(sessionDishModifier._id)) {
                (modifier as any).selected = sessionDishModifier.selected;
                break;
            }
        }
    }

    res.send({ modifiers });
});


export {
    router as OrderRouter
}


async function calculateAmount(restaurantId: ObjectId, ds: SessionDish[], tip: number = 0, serviceFee?: { amount: number; type: 1 | 2 }) {
    const dishesId: ObjectId[] = [];


    for (let dish of ds) {
        dishesId.push(dish.dishId);
    }

    const dishes = await getDishes(restaurantId, { _id: { $in: dishesId } }, { projection: { library: { preview: 1, }, modifiers: { _id: 1, options: { price: 1, _id: 1, } }, info: { price: 1, name: 1, }, } }).toArray();

    const convertedDishes: {
        name: string;
        price: number;
        image: any;
        _id: ObjectId;
        dishId: ObjectId;
        comment: string;
    }[] = [];


    const findDish = (dishId: ObjectId) => {
        for (let dish of dishes) {
            if (dish._id.equals(dishId)) {
                return dish;
            }
        }
        return null!;
    }

    let subtotal = 0;

    for (let d of ds) {
        const dish = findDish(d.dishId);

        if (!dish) {
            return null;
        }

        if(dish.modifiers && d.modifiers) {
            for(const modifier of dish.modifiers!) {
                for(const sessionDishModifier of d.modifiers) {
                    if(modifier._id.equals(sessionDishModifier._id)) {
                        for(const sdmo of sessionDishModifier.selected) {
                            for(const modifierOption of modifier.options) {
                                if(sdmo.equals(modifierOption._id)) {
                                    dish.info.price += modifierOption.price;
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }

        convertedDishes.push({
            name: dish.info?.name,
            price: dish.info?.price,
            image: dish.library?.preview,
            dishId: dish._id,
            _id: d._id,
            comment: d.info?.comment,
        });

        subtotal += dish.info.price;
    }

    const hst = subtotal * 0.13;
    const service = serviceFee ? serviceFee?.type == 1 ? serviceFee.amount : subtotal * serviceFee.amount / 100 : null!;
    const total = hst + subtotal + (service || 0) + tip;


    return {
        money: {
            subtotal: Math.floor(subtotal),
            hst: Math.floor(hst),
            total: Math.floor(total),
            service: Math.floor(service),
            tip: Math.floor(tip),
        },
        dishes: convertedDishes,
    };
}