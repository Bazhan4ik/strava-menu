import express from "express";
import vhost from "vhost";
import path from "path";
import { Router } from "./routers/router.js";



const app = express();

const accountApp = express();
const publicApp = express();
const restaurantApp = express();

publicApp.use(express.static(path.join(process.cwd(), "web/dist/public")));
accountApp.use(express.static(path.join(process.cwd(), "web/dist/account")));
restaurantApp.use(express.static(path.join(process.cwd(), "web/dist/restaurant")));

app.use(vhost("*.*.*", restaurantApp))
app.use(vhost("account.*.*", accountApp));
app.use(vhost("www.*.*", publicApp));




main();


async function main() {
    try {

        app.use("/api", Router);

        publicApp.get("**", (req, res) => {
            res.sendFile(path.join(process.cwd(), "web/dist/public/index.html"));
        });
        accountApp.get("**", (req, res) => {
            res.sendFile(path.join(process.cwd(), "web/dist/account/index.html"));
        });
        
    } catch (e) {
        throw e;
    }
}


app.listen(process.env.PORT || 3000, () => {
    console.log("RUNNING ON ", process.env.PORT || 3000);
});
