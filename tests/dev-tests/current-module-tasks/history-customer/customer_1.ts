import { Browser, Page } from "puppeteer";
import { customerNavigation } from "../../utils/customer/navigation.js";
import { addItemToCart, getItems, getRandomItemId } from "../../utils/customer/items.js";
import { switchToDelivery } from "../../utils/customer/delivery.js";
import { waitForSelector } from "../../utils/puppeteer/other.js";
import { fillStripeForm } from "../../utils/customer/checkout.js";



async function CUSTOMER_1(browser: Browser, page: Page) {

    await customerNavigation(page).location("tim-hortons");

    const items = await getItems(page);

    const itemId = await getRandomItemId(items);

    await addItemToCart(page, itemId, 4);

    await customerNavigation(page).home();

    await customerNavigation(page).preview();

    await switchToDelivery(page, "92 renaissance dr", { line1: "92 Renaissance Drive", state: "ON", city: "St. Thomas", postalCode: "N5R 0C1", phone: "2899687940" });

    await waitForSelector(page, ".app-order-info:not(.modal-open)");

    await customerNavigation(page).checkout();

    await fillStripeForm(page, { email: "bazhantt@gmail.com", card: "4242424242424242", cvc: "123", expiry: "1234", postalCode: "N5R0C1" });

    // browser.close();
}

export {
    CUSTOMER_1
}