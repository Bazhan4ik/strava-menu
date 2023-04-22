import { Page } from "puppeteer";
import { config } from "../../config.js";
import { clickOn, waitForSelector } from "../puppeteer/other.js";

function customerNavigation(page: Page, restaurantId = config.url.defaultRestaurantId) {

    const pathAndQuery = page.url().replace(config.url.customer, "");
    const path = pathAndQuery.split("?")[0];
    const [_empty, restaurant, location, route1, route2] = path.split("/");
    

    return {
        location: (locationId: string) => {
            return page.goto(`${config.url.customer}/${restaurantId}/${locationId}/`);
        },
        home: async () => {
            if(route1 == "item") {
                await waitForSelector(page, "#back-button");
                
                await clickOn(page, "#back-button");
            } else {
                await page.goto(`${config.url.customer}/${restaurantId}/`);
            }
        },
        preview: async () => {
            if(route1 == "home") {
                await waitForSelector(page, "#goto-preview");

                await clickOn(page, "#goto-preview");
            } else {
                await page.goto(`${config.url.customer}/${restaurantId}/order/preview`);
            }
        },
        checkout: async () => {
            if(route1 == "order" && route2 == "preview") {
                await waitForSelector(page, "#goto-checkout");

                await clickOn(page, "#goto-checkout");

                await page.waitForNavigation()
            } else {
                await page.goto(`${config.url.customer}/${restaurantId}/order/checkout`);
            }
        }


    };
}

export {
    customerNavigation
}