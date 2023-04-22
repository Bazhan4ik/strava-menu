import { Router } from "express";
import { Locals } from "../../models/general.js";
import { WaiterRequest, TimelineComponent } from "../../models/session.js";
import { id } from "../../utils/other/id.js";
import { customerRestaurant } from "../../middleware/customerRestaurant.js";
import { customerSession } from "../../middleware/customerSession.js";
import { updateSession } from "../../utils/data/sessions.js";
import { sendToWaiterWaiterRequest, sendToWaiterCancelWaiterRequest } from "../../utils/socket/waiterRequest.js";
import { getDelay } from "../../utils/other/time.js";





const router = Router({ mergeParams: true });




router.put("/cash", customerRestaurant({}), customerSession({ info: { id: 1, type: 1 }, payment: { money: { total: 1, }, } }, { info: { name: 1, }, avatar: 1, }), async (req, res) => {
    const { restaurant, session, user } = res.locals as Locals;

    if(!restaurant.locations) {
        return res.status(500).send({ reason: "InvalidError" });
    }


    const getLocation = () => {
        for(const location of restaurant.locations!) {
            if(location._id.equals(session.info.location)) {
                return location;
            }
        }
        return null;
    }

    const location = getLocation();
    if(!location) {
        return res.status(404).send({ reason: "LocationNotFound" });
    }

    if(session.info.type == "takeout" || session.info.type == "delivery") {
        return res.status(403).send({ reason: "NotAllowed" });
    }


    const newRequest: WaiterRequest = {
        _id: id(),
        active: true,
        reason: "cash",
        requestedTime: Date.now(),
    };

    const timeline: TimelineComponent = {
        action: "waiterRequest/create",
        time: Date.now(),
        userId: "customer",
        waiterRequestId: newRequest._id,
    }


    const update = await updateSession(restaurant._id, { _id: session._id }, { $push: { waiterRequests: newRequest, timeline } }, { projection: { _id: 1, } });


    const request = {
        _id: newRequest._id,
        reason: "cash",
        active: true,
    }

    res.send({ updated: update.ok == 1, request });


    let username = user ? `${user?.info?.name?.first} ${user.info?.name?.last}` : "Anonymous customer";

    sendToWaiterWaiterRequest(restaurant._id, session.info.location, {
        _id: newRequest._id,
        sessionId: session._id,
        customer: { name: username, avatar: user?.avatar?.buffer },
        requestedTime: getDelay(newRequest.requestedTime),
        self: false,
        total: session.payment?.money?.total || null!,
        reason: "cash",
        sessionType: session.info.type,
        sessionIdNumber: session.info.id,

        ui: {
            acceptButtonText: "Accept",
            cancelButtonText: "Cancel",
            resolveButtonText: request.reason == "cash" ? `Collected $${session.payment?.money?.total! / 100}` : "Resolved",
            acceptedTitle: request.reason == "cash" ? `Customer has to pay $${session.payment?.money?.total! / 100}` : null!,
            reasonTitle: "Collect cash & confirm order",
            typeTitle: "Table",
            idTitle: "#" + session.info.id,
        }
    });
});
router.put("/cancel", customerRestaurant({}), customerSession({ waiterRequests: 1, }, {}), async (req, res) => {
    const { restaurant, session } = res.locals as Locals;
    const { requestId } = req.body;

    if (!requestId) {
        return res.status(400).send({ reason: "RequestIdNotProvided" });
    }

    if (!session.waiterRequests || session.waiterRequests.length == 0) {
        return res.status(400).send({ reason: "NoWaiterRequests" });
    }


    let request: WaiterRequest = null!;

    for (let r of session.waiterRequests) {
        if (r._id.equals(requestId) && r.active) {
            request = r;
            break;
        } else if (r._id.equals(requestId)) {
            return res.status(400).send({ reason: "RequestInactive" });
        }
    }

    if (!request) {
        return res.status(404).send({ reason: "RequestNotFound" });
    }

    const timeline: TimelineComponent = {
        action: "waiterRequest/cancel",
        waiterRequestId: request._id,
        userId: "customer",
        time: Date.now(),
    }

    const update = await updateSession(
        restaurant._id,
        { _id: session._id, },
        {
            $set: {
                "waiterRequests.$[request].active": false,
                "waiterRequests.$[request].canceledTime": Date.now(),
            },
            $push: { timeline },
        },
        { arrayFilters: [{ "request._id": request._id }], projection: { _id: 1 } },
    );

    res.send({ updated: update.ok == 1 });


    sendToWaiterCancelWaiterRequest(restaurant._id, session.info.location, { sessionId: session._id, requestId: request._id });
});





export {
    router as RequestOrder,
}