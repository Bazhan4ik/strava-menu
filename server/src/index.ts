import { server } from "./setup/setup.js";
import { client } from "./setup/mongodb.js";



main();


async function main() {
    try {
        import("./utils/console.js");

        await client.connect();

    } catch (e) {
        throw e;
    }
}


server.listen(process.env.PORT || 3000, () => {
    console.log("RUNNING ON ", process.env.PORT || 3000);
});
