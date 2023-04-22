import { Page } from "puppeteer";
import { clickOn, enterText, getInputValue, waitForSelector } from "../puppeteer/other.js";



async function switchToDelivery(
    page: Page,
    address: string,
    items: {
        phone: string,
        state: string,
        city: string,
        line1: string,
        postalCode: string,
    }
) {
    await waitForSelector(page, "#type-delivery:not(.orange-button):not(:disabled)");

    await clickOn(page, "#type-delivery");

    await waitForSelector(page, "#full-address-input");

    await clickOn(page, "#full-address-input");

    await enterText(page, "#full-address-input", address, 10);

    await waitForSelector(page, ".pac-container > .pac-item");

    await clickOn(page, ".pac-container > .pac-item");

    await waitForSelector(page, "#input_phone");

    await enterText(page, "#input_phone", items.phone);

    const [
        state,
        city,
        postalCode,
        line1,
        phone
    ] = await Promise.all([
        getInputValue(page, "#input_state"),
        getInputValue(page, "#input_city"),
        getInputValue(page, "#input_postal-code"),
        getInputValue(page, "#input_line1"),
        getInputValue(page, "#input_phone"),
    ]);

    if(!city || city == "" || city.length == 0) {
        await enterText(page, "#input_city", items.city);
    }
    if(!state || state == "" || state.length == 0) {
        await enterText(page, "#input_state", items.state);
    }
    if(!postalCode || postalCode == "" || postalCode.length == 0) {
        await enterText(page, "#input_postal-code", items.postalCode);
    }
    if(!line1 || line1 == "" || line1.length == 0) {
        await enterText(page, "#input_line1", items.line1);
    }
    if(!phone || phone == "" || phone.length == 0) {
        await enterText(page, "#input_phone", items.phone);
    }

    await clickOn(page, "#save-delivery-address");
}


export {
    switchToDelivery
}