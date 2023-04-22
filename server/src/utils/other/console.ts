const c = import("chalk");

(async () => {
    const chalk = new (await c).Chalk()

    
    console.error = (...data: any[]) => {
        console.log(chalk.bgRed(data.map(msg => typeof msg == "object" ? JSON.stringify(msg) : msg.toString()).join(" ")));
    }
})();