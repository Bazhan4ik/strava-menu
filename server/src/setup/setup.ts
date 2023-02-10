import express from "express";
import vhost from "vhost";
import cors from "cors";
import path from "path";
import { Server as HTTPServer, createServer as createHttpServer } from "http";
import { createServer as createHttpsServer } from "https";
import { readFileSync } from "fs";
import { passport } from "./passport.js";
import session from "express-session";
import morgan from "morgan";
import { AccountsRouter } from "../routers/accounts.js";
import { DataRouter } from "../routers/data.js";
import { RestaurantsRouter } from "../routers/restaurants.js";
import { CustomerRouter } from "../routers/customers/customer.js";
import { WebhookRouter } from "../routers/webhooks.js";
import { Server, } from "socket.io";
import { StaffRouter } from "../routers/staff/staff.js";


const app = express();
app.use(morgan("dev"));
app.use(cors({
    credentials: true,
    origin: "*"
}));


const accountApp = express();
const publicApp = express();
const restaurantApp = express();
const apiApp = express();


publicApp.use(express.static(path.join(process.cwd(), "web/dist/public")));
accountApp.use(express.static(path.join(process.cwd(), "web/dist/account")));
restaurantApp.use("/dashboard", express.static(path.join(process.cwd(), "web/dist/restaurant")));
restaurantApp.use("/staff", express.static(path.join(process.cwd(), "web/dist/staff")));
restaurantApp.use("/", express.static(path.join(process.cwd(), "web/dist/customer")));


apiApp.use(cors({
    credentials: true,
    origin: (origin: any) => {
        console.log(origin);
        return [
            "https://restaurant.stravamenu.com",
            "https://account.stravamenu.com",
        ].includes(origin);
    }
}));

apiApp.use(express.json({ limit: "50mb" }));
apiApp.use(express.urlencoded({ limit: "50mb" }));

apiApp.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
apiApp.use(passport.initialize());
apiApp.use(passport.session());


apiApp.use("/data", DataRouter);
apiApp.use("/accounts", AccountsRouter);
apiApp.use("/restaurants/:restaurantId", RestaurantsRouter);
apiApp.use("/customer/:restaurantId", CustomerRouter);
apiApp.use("/webhooks", WebhookRouter);
apiApp.use("/staff/:restaurantId", StaffRouter);


publicApp.get("**", (req, res) => {
    res.sendFile(path.join(process.cwd(), "web/dist/public/index.html"));
});
accountApp.get("**", (req, res) => {
    res.sendFile(path.join(process.cwd(), "web/dist/account/index.html"));
});

restaurantApp.get("/staff/*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "web/dist/staff/index.html"));
});
restaurantApp.get("/dashboard/*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "web/dist/restaurant/index.html"));
});
restaurantApp.get("/*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "web/dist/customer/index.html"));
});

let server: HTTPServer;
if (process.env.PROD) {
    app.use(vhost("restaurant.*.*", restaurantApp));
    app.use(vhost("account.*.*", accountApp));
    app.use(vhost("www.*.*", publicApp));
    app.use(vhost("api.*.*", apiApp));

    server = createHttpServer(app);
} else {
    // USE mydomain.com:3000 FOR LOCAL DEVELOPMENT

    app.use(vhost("restaurant.*.*", restaurantApp));
    app.use(vhost("account.*.*", accountApp));
    app.use(vhost("www.*.*", publicApp));
    app.use(vhost("api.*.*", apiApp));



    // this is used because you can't port forward a subdomain to ngrok
    // for example you can't port forward `api.mylocaldomain.com:3000` to ngrok
    // but if api is served without a subdomain you can port forward `mylocaldomain.com:3000` it will work
    // you will need this for stripe webhooks.
    app.use(apiApp);



    server = createHttpsServer({
        key: readFileSync(path.join(process.cwd(), "server/resources", "ssl", "cert.key")),
        cert: readFileSync(path.join(process.cwd(), "server/resources", "ssl", "cert.pem")),
    }, app);
}



const io: Server = new Server(server, { cors: { origin: [ "https://restaurant.mydomain.com:3000" ] } });


export {
    server,
    io
}