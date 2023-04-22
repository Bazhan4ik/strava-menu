import p from "puppeteer";
import { createBrowser } from "./utils/puppeteer/browser.js";
import { loginToAcccount } from "./utils/account/login.js";
import { goToDashboard, goToStaff } from "./utils/restaurant/navigation.js";
import { getDishes } from "./utils/staff/dishes.js";
import { getDishByStatus } from "./utils/staff/cook.ts/take.js";
import { run_staff } from "./current-module-tasks/staff.js";
import { run_customer } from "./current-module-tasks/customer.js";





main();


async function main() {
    
    // const { browser: browserAuthorized_1, page: browserAuthorized_1page } = await createBrowser()
    const { browser: browser_1, page: browser_1page } = await createBrowser();
    
    // await loginToAcccount(browserAuthorized_1page);
    
    
    
    
    //  ran synchronously
    // run_staff(browserAuthorized_1, browserAuthorized_1page);
    run_customer(browser_1, browser_1page);

}















