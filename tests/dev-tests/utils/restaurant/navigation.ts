import { Page } from "puppeteer";
import { config } from "../../config.js";
import { clickOn, waitForSelector } from "../puppeteer/other.js";

function goToDashboard(page: Page, restaurantId = config.url.defaultRestaurantId) {
    return {
        home: () => {
            return page.goto(`${config.url.restaurant}/${restaurantId}/home`);
        },
        items: () => {
            return page.goto(`${config.url.restaurant}/${restaurantId}/menu/items`);
        },
        collections: () => {
            return page.goto(`${config.url.restaurant}/${restaurantId}/menu/collections`);
        },
        ingredients: () => {
            return page.goto(`${config.url.restaurant}/${restaurantId}/ingredients`);
        },
        locations: () => {
            return page.goto(`${config.url.restaurant}/${restaurantId}/locations`);
        },
        staff: () => {
            return page.goto(`${config.url.restaurant}/${restaurantId}/staff`);
        },
        orders: () => {
            return page.goto(`${config.url.restaurant}/${restaurantId}/orders`);
        },
        customers: () => {
            return page.goto(`${config.url.restaurant}/${restaurantId}/customers`);
        },
        layout: () => {
            return page.goto(`${config.url.restaurant}/${restaurantId}/layout`);
        },
        tables: () => {
            return page.goto(`${config.url.restaurant}/${restaurantId}/tables`);
        },
        tablesQRCodes: () => {
            return page.goto(`${config.url.restaurant}/${restaurantId}/tables/qr-codes`);
        },
    };
}
async function goToStaff(page: Page, restaurantId = config.url.defaultRestaurantId) {
    await page.goto(`${config.url.staff}/${restaurantId}`)
    return {
        location: async (locationId: string) => {
            await waitForSelector(page, `#${locationId}`);

            await clickOn(page, `#${locationId}`);
        }
    }
}

export {
    goToDashboard,
    goToStaff,
}