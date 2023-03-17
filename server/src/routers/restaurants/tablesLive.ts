import { Router } from "express";
import { ObjectId } from "mongodb";
import { Locals } from "../../models/general.js";
import { logged } from "../../utils/middleware/auth.js";
import { restaurantWorker } from "../../utils/middleware/restaurant.js";
import { getSessions } from "../../utils/sessions.js";




const router = Router({ mergeParams: true });



interface ConvertedTable {
    id: number;
    _id: ObjectId;
    taken: boolean;
    connected: string;
    sessions: { status: string; connected: string; amount: number; }[];
    total: number;
}
router.get("/", logged(), restaurantWorker({ tables: 1, }, { work: { manager: true } }), async (req, res) => {
    const { locationId } = req.params;
    const { restaurant } = res.locals as Locals;

    if(!restaurant.tables) {
        return res.status(500).send({ reason: "InvalidError" });
    }
    
    const tables = restaurant.tables[locationId];
    if(!tables) {
        return res.status(400).send({ reason: "InvalidLocation" });
    }


    const sessions = await getSessions(
        restaurant._id,
        { "info.type": "dinein", },
        { projection: {
            status: 1,
            info: { id: 1, type: 1 },
            payment: { money: { total: 1, } },
            timing: { ordered: 1, connected: 1 },
            customer: { by: 1, customerId: 1, onBehalf: 1 },
        } },
    ).toArray();


    const sessionsOnTheTable = (table: number): { status: string; amount: number; connected: string; }[] => {
        const result = [];
        for(const session of sessions) {
            if(session.info?.id == table.toString()) {
                if(session.status == "ordering" && (session.timing.connected || 0) < Date.now() - 600000) {
                    continue;
                }
                if(session.status == "ordering" && (session.timing.connected || 0) < Date.now() - 300000) {
                    result.push({ status: "ordering", connected: Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(session.timing.connected),  amount: session.payment?.money?.total || 0 })
                    continue;
                }
                result.push({ status: session.status, connected: Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(session.timing.connected), amount: session.payment?.money?.total || 0 });
            }
        }
        return result;
    }

    const result: ConvertedTable[] = [];
    
    for(const table of tables) {
        const tableSessions = sessionsOnTheTable(table.id);

        result.push({
            _id: table._id,
            id: table.id,
            taken: tableSessions.length > 0,
            sessions: tableSessions,
            connected: tableSessions[tableSessions.length - 1]?.connected,
            total: tableSessions.reduce((a, s) => a + s.amount, 0)
        });
        
    }


    res.send(result);
});







export {
    router as LiveTablesRouter,
}