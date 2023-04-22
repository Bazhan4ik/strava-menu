import { STAFF_1 } from "./history-staff/staff_1.js";
import { Browser, Page } from "puppeteer";



function run_staff(browser: Browser, page: Page) {

    STAFF_1(browser, page);         // literature/staff_1

}




export {
    run_staff
}