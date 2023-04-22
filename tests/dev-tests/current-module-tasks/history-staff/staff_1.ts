import { goToStaff } from "../../utils/restaurant/navigation.js";
import { getDishByStatus } from "../../utils/staff/cook.ts/take.js";
import { getDishes } from "../../utils/staff/dishes.js";
import { Browser, Page } from "puppeteer";



async function STAFF_1(_browser: Browser, page: Page) {

    await (await goToStaff(page)).location("tim-hortons");

    const dishElements = await getDishes(page);

    const dishElement = await getDishByStatus(dishElements, "disposing");

    console.log(dishElement);

    if(!dishElement) {
        return "noelement";
    }

    dishElement?.getProperty("classList");
}

export {
    STAFF_1
}