import { Page } from "puppeteer";
import { waitForSelector } from "../puppeteer/other.js";






async function getDishes(page: Page) {
    await waitForSelector(page, "#cook-items");

    const list = await page.$$("#cook-items > app-item-cook > button");

    console.log(list);

    return list;
}




export {
    getDishes
}





