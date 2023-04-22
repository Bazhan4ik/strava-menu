import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { Worker, WorkerSettings } from "../../models/worker.js";
import { id } from "../../utils/other/id.js";
import { logged } from "../../middleware/auth.js";
import { restaurantWorker } from "../../middleware/restaurant.js";
import { updateRestaurant } from "../../utils/data/restaurant.js";
import { getUser, getUsers, updateUser } from "../../utils/data/users.js";




const router = Router({ mergeParams: true });


router.get("/", logged(), restaurantWorker({ staff: 1, locations: { _id: 1, id: 1, name: 1, } }, { staff: { available: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;

    if(!restaurant.staff || !restaurant.locations) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    const getLocation = (id: ObjectId) => {
        for(const l of restaurant.locations!) {
            if(l._id.equals(id)) {
                return {
                    name: l.name,
                    id: l.id,
                };
            }
        }
    }
    const getIds = () => {
        const result = [];
        for(let u of restaurant.staff!) {
            result.push(u.userId);
        }
        return result;
    }
    const getUser = (id: ObjectId) => {
        for(let u of users) {
            if(u._id.equals(id)) {
                return {
                    name: `${u.info?.name?.first} ${u.info?.name?.last}`,
                    avatar: u.avatar?.buffer,
                };
            }
        }
    }


    const users = await getUsers({ _id: { $in: getIds() } }, { projection: { info: { name: 1 }, avatar: 1 } }).toArray();


    const result: {
        name: string;
        _id: ObjectId;
        avatar: any;
        
        location: {
            name: string;
            id: string;            
        }
    }[] = [];

    for(const worker of restaurant.staff) {
        result.push({
            location: getLocation(worker.locations[0])!,
            _id: worker.userId,
            ...getUser(worker.userId)!,
        });
    }


    
    res.send(result);
});



router.get("/add/find", logged(), restaurantWorker({}, { staff: { hiring: true } }), async (req, res) => {
    const { text } = req.query;

    if(!text || typeof text != "string") {
        return res.status(400).send({ reason: "TextNotProvided" });
    }

    const users = await getUsers({ "info.email": text }, { projection: { info: { name: 1, email: 1 }, avatar: 1, } }).toArray();

    const result = [];

    for(let user of users) {
        result.push({
            name: `${user.info?.name?.first} ${user.info?.name?.last}`,
            avatar: user.avatar?.buffer,
            _id: user._id,
            email: user.info?.email,
        });
    }


    res.send(result);
});
router.get("/add/:userId", logged(), restaurantWorker({ staff: 1, locations: { city: 1, line1: 1, name: 1, _id: 1, } }, { staff: { hiring: true } }), async (req, res) => {
    const { userId } = req.params;
    const { restaurant } = res.locals as Locals;

    if(!userId || userId.length != 24) {
        return res.status(400).send({ reason: "InvalidUserId" });
    }

    if(!restaurant.staff || !restaurant.locations) {
        return res.status(500).send({ reason: "InvalidReason" });
    }

    const locations = [];

    for(let location of restaurant.locations) {
        locations.push({
            name: location.name,
            _id: location._id,
            city: location.city,
            line1: location.line1,
        });
    }
    

    for(let worker of restaurant.staff) {
        if(worker.userId.equals(userId)) {
            return res.status(403).send({ reason: "UserAdded" });
        }
    }


    const user = await getUser({ _id: id(userId) }, { projection: { info: { name: 1, email: 1 }, avatar: 1 } });

    if(!user) {
        return res.status(404).send({ reason: "UserNotFound" });
    }

    res.send({
        user: {
            name: `${user.info?.name?.first} ${user.info?.name?.last}`,
            email: user.info?.email,
            avatar: user.avatar?.buffer,
            _id: user._id
        },
        locations
    });
});
router.post("/add/:userId", logged(), restaurantWorker({ staff: { userId: 1, settings: 1 }, locations: { _id: 1 } }, { staff: { hiring: true } }), async (req, res) => {
    const { userId } = req.params;
    const { settings: updateSettings, location } = req.body;
    const { restaurant, user } = res.locals as Locals;


    if(!userId || userId.length != 24) {
        return res.status(400).send({ reason: "InvalidUserId" });
    }

    if(!location || typeof location != "string" || location.length != 24) {
        return res.status(400).send({ reason: "LocationNotProvided" });
    }

    if(!restaurant.staff || !restaurant.locations) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    let lpass = false;
    for(let l of restaurant.locations) {
        if(l._id.equals(location)) {
            lpass = true;
            break;
        }
    }
    if(!lpass) {
        return res.status(404).send({ reason: "LocationNotFound" });
    }
    



    const settings = updateOtherProperties(updateSettings);

    if(!settings) {
        return res.status(400).send({ reason: "InvalidSettings" });
    }



    let hiringManagerSettings: WorkerSettings = null!;
    for(let worker of restaurant.staff) {
        if(worker.userId.equals(user._id)) {
            hiringManagerSettings = worker.settings;
        }
    }

    if(!hiringManagerSettings) {
        return res.status(403).send({ reason: "NotWorker" });
    }

    const pass = checkNewManagerSettings(hiringManagerSettings , settings);

    if(!pass) {
        return res.status(403).send({ reason: "InvalidError" });
    }

    const newWorker: Worker = {
        settings: settings,
        userId: id(userId),
        locations: [id(location)],
        joined: Date.now(),
    };

    const update = await updateRestaurant(
        { _id: restaurant._id },
        { $push: { staff: newWorker } },
        { projection: { _id: 1 } }
    );

    const userUpdate = await updateUser(
        { _id: id(userId) },
        { $push: {
            "restaurants": {
                redirectTo: settings.work?.manager ? "dashboard" : "staff",
                restaurantId: restaurant._id,
            }
        } },
        { projection: { _id: 1 } }
    );


    res.send({ updated: update.ok == 1 });
});



router.get("/:userId", logged(), restaurantWorker({ staff: 1, locations: { _id: 1, name: 1, city: 1, line1: 1 } }, { staff: { available: true } }), async (req, res) => {
    const { userId } = req.params;
    const { restaurant } = res.locals as Locals;


    if(!userId || userId.length != 24) {
        return res.status(400).send({ reason: "InvalidUserId" });
    }

    if(!restaurant.staff) {
        return res.status(500).send({ reason: "InvalidError" });
    }

    let worker: Worker = null!;

    for(let w of restaurant.staff) {
        if(w.userId.equals(userId)) {
            worker = w;
            break;
        }
    }

    if(!worker) {
        return res.status(404).send({ reason: "NotWorker" });
    }


    const user = await getUser({ _id: worker.userId }, { projection: { avatar: 1, info: { name: 1, email: 1 } } });

    if(!user) {

        // handle account deleted

        return res.status(400).send({ reason: "AccountDeleted" });
    }

    const getLocations = () => {
        const result = [];
        if(!restaurant.locations) {
            return;
        }

        for(let l of restaurant.locations) {
            if(l._id.equals(worker.locations[0])) {
                result.push(l);
            }
        }

        return result;
    }

    const result: any = {
        account: {
            name: `${user.info?.name?.first} ${user.info?.name?.last}`,
            email: user.info?.email,
            avatar: user.avatar?.buffer,
            _id: userId
        },
        locations: getLocations(),
        settings: worker.settings,
    };





    res.send(result);
});
router.put("/:userId/settings", logged(), restaurantWorker({ }, { staff: { available: true } }), async (req, res) => {
    const { userId } = req.params;
    const { settings: updateSettings } = req.body;
    const { restaurant, user } = res.locals as Locals;


    if(!userId || userId.length != 24) {
        return res.status(400).send({ reason: "InvalidUserId" });
    }

    if(user._id.equals(userId)) {
        return res.sendStatus(403);
    }

    if(!restaurant.staff) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    let worker: Worker = null!;
    for(let w of restaurant.staff) {
        if(w.userId.equals(userId)) {
            worker = w;
            break;
        }
    }

    if(!worker) {
        return res.status(404).send({ reason: "NotWorker" });
    }


    const settings = updateOtherProperties(updateSettings);

    if (!settings) {
        return res.status(400).send({ reason: "InvalidSettings" });
    }



    let hiringManagerSettings: WorkerSettings = null!;
    for (let worker of restaurant.staff) {
        if (worker.userId.equals(user._id)) {
            hiringManagerSettings = worker.settings;
        }
    }

    if (!hiringManagerSettings) {
        return res.status(403).send({ reason: "NotWorker" });
    }

    const pass = checkNewManagerSettings(hiringManagerSettings, settings);


    if(!pass) {
        return res.sendStatus(403)
    }

    const update = await updateRestaurant(
        { _id: restaurant._id, },
        { $set: { "staff.$[worker].settings": settings } },
        { arrayFilters: [ { "worker.userId": id(userId) } ] }
    );


    res.send({
        updated: update.ok == 1
    });

    await updateUser(
        { _id: id(userId) },
        { $set: { "restaurants.$[restaurant].redirectTo": settings.work?.manager ? "dashboard" : "staff" } },
        { arrayFilters: [ { "restaurant.restaurantId": restaurant._id } ], noResponse: true }
    );
});




export {
    router as StaffRouter,
};









function checkNewManagerSettings(hiringManagerSettings: WorkerSettings, newManagerSettings: WorkerSettings): WorkerSettings | "invalid" | null {

    // new manager can't be owner
    newManagerSettings.isOwner = false;

    if (hiringManagerSettings.isOwner) {
        return newManagerSettings;
    }
    


    if (        // check for all the properties
        
        !hiringManagerSettings.work ||
        !hiringManagerSettings.customers ||
        !hiringManagerSettings.items ||
        !hiringManagerSettings.settings ||
        !hiringManagerSettings.staff ||
        !hiringManagerSettings.settings ||
        !hiringManagerSettings.collections ||
        !hiringManagerSettings.locations ||
        !hiringManagerSettings.cook ||
        !hiringManagerSettings.waiter 

        ||

        !newManagerSettings.work ||
        !newManagerSettings.customers ||
        !newManagerSettings.items ||
        !newManagerSettings.settings ||
        !newManagerSettings.staff ||
        !newManagerSettings.settings ||
        !newManagerSettings.locations ||
        !newManagerSettings.collections ||
        !newManagerSettings.waiter ||
        !newManagerSettings.cook
    ) {
        return "invalid";
    }



    // checking if manager that hires a new manager assigned more power to the new manager

    // items
    if (newManagerSettings.items.available && !hiringManagerSettings.items.available) {
        return null;
    }
    if (newManagerSettings.items.removing && !hiringManagerSettings.items.removing) {
        return null;
    }
    if (newManagerSettings.items.adding && !hiringManagerSettings.items.adding) {
        return null;
    }

    // staff
    if (newManagerSettings.staff.available && !hiringManagerSettings.staff.available) {
        return null;
    }
    if (newManagerSettings.staff.settings && !hiringManagerSettings.staff.settings) {
        return null;
    }
    if (newManagerSettings.staff.firing && !hiringManagerSettings.staff.firing) {
        return null;
    }
    if (newManagerSettings.staff.hiring && !hiringManagerSettings.staff.hiring) {
        return null;
    }

    // customers
    if (newManagerSettings.customers.available && !hiringManagerSettings.customers.available) {
        return null;
    }
    if (newManagerSettings.customers.blacklisting && !hiringManagerSettings.customers.blacklisting) {
        return null;
    }
    if (newManagerSettings.customers.tables && !hiringManagerSettings.customers.tables) {
        return null;
    }
    
    // settings
    if (newManagerSettings.settings.available && !hiringManagerSettings.settings.available) {
        return null;
    }
    if (newManagerSettings.settings.customers && !hiringManagerSettings.settings.customers) {
        return null;
    }
    if (newManagerSettings.settings.payments && !hiringManagerSettings.settings.payments) {
        return null;
    }
    if (newManagerSettings.settings.info && !hiringManagerSettings.settings.info) {
        return null;
    }

    // collections
    if (newManagerSettings.collections.available && !hiringManagerSettings.collections.available) {
        return null;
    }
    if (newManagerSettings.collections.adding && !hiringManagerSettings.collections.adding) {
        return null;
    }
    if (newManagerSettings.collections.removing && !hiringManagerSettings.collections.removing) {
        return null;
    }

    // locations
    if (newManagerSettings.locations.available && !hiringManagerSettings.locations.available) {
        return null;
    }
    if (newManagerSettings.locations.adding && !hiringManagerSettings.locations.adding) {
        return null;
    }
    if (newManagerSettings.locations.removing && !hiringManagerSettings.locations.removing) {
        return null;
    }



    return newManagerSettings;
}
function updateOtherProperties(settings: WorkerSettings) {
    if(
        !settings.work || 
        !settings.settings || 
        !settings.locations || 
        !settings.items || 
        !settings.collections || 
        !settings.staff || 
        !settings.customers ||
        !settings.cook ||
        !settings.waiter
    ) {
        return null;
    }

    let isManager = false;

    if (settings.settings) {
        if (settings.settings.payments || settings.settings.customers || settings.settings.info) {
            settings.settings.available = true;
            isManager = true;
        } else if (!settings.settings.payments && !settings.settings.customers || !settings.settings.info) {
            settings.settings.available = false;
        }
    }

    if (settings.locations) {
        if (settings.locations.adding || settings.locations.removing) {
            settings.locations.available = true;
            isManager = true;
        } else if (!settings.locations.adding && !settings.locations.removing) {
            settings.locations.available = false;
        }
    }

    if (settings.items) {
        if (settings.items.removing || settings.items.adding) {
            settings.items.available = true;
            isManager = true;
        } else if (!settings.items.removing && !settings.items.adding) {
            settings.items.available = false;
        }
    }

    if (settings.collections) {
        if (settings.collections.adding || settings.collections.removing) {
            settings.collections.available = true;
            isManager = true;
        } else if (!settings.collections.adding && !settings.collections.removing) {
            settings.collections.available = false;
        }
    }

    if (settings.staff) {
        if (settings.staff.settings || settings.staff.firing || settings.staff.hiring) {
            settings.staff.available = true;
            isManager = true;
        } else if (!settings.staff.settings && !settings.staff.firing && !settings.staff.hiring) {
            settings.staff.available = false;
        }
    }

    if (settings.customers) {
        if (settings.customers.tables || settings.customers.blacklisting) {
            settings.customers.available = true;
            isManager = true;
        } else if (!settings.customers.tables && !settings.customers.blacklisting) {
            settings.customers.available = false;
        }
    }


    settings.work!.manager! = isManager;
    settings.isOwner = false;

    if(!settings.work.manager && !settings.work.waiter && !settings.work.cook) {
        return null;
    }

    return settings;
}
