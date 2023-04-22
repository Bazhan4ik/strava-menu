import { Page } from "puppeteer";
import { config } from "../../config.js";
import { waitForSelector, enterText, clickOn } from "../puppeteer/other.js";

async function gotoDefault(page: Page) {
    await page.goto(config.url.main);
}
async function loginToAcccount(page: Page, username = "bazhantt@gmail.com", password = "123123123") {
    await page.goto(`${config.url.account}/login`);

    await waitForSelector(page, "#username");
    await waitForSelector(page, "#password");

    await enterText(page, "#username", username);
    await enterText(page, "#password", password);

    await clickOn(page, "#submit-button");

    await waitForSelector(page, "#restaurant-list");


}


export {
    loginToAcccount,
    gotoDefault,
}