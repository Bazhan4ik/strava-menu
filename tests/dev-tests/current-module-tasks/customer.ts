import { config } from "../config.js";
import { customerCleaning_1 } from "./history-customer/cleaning_1.js";
import { CUSTOMER_1 } from "./history-customer/customer_1.js";
import { Browser, Page } from "puppeteer";



async function run_customer(browser: Browser, page: Page) {

    await CUSTOMER_1(browser, page);         // literature/customer_1


    // customerCleaning_1(config.url.defaultRestaurantId);
}




export {
    run_customer
}