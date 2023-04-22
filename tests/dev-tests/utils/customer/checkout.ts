import { ElementHandle, Page } from "puppeteer";
import { clickOn, enterText, waitForSelector } from "../puppeteer/other.js";




async function fillStripeForm(page: Page, items: { email: string; card: string; postalCode: string; cvc: string; expiry: string; }) {

    await waitForSelector(page, ".manual");
    await waitForSelector(page, "#input_email");

    await enterText(page, "#input_email", items.email);

    const manual = await page.$(".manual");

    if(!manual) {
        console.error("ERROR: manual element not found at fullStripeForm()");
        return;
    }

    

    await waitForSelector(page, ".manual iframe[name^=__privateStripeFrame]");
    
    const frame = await page.$(".manual iframe[name^=__privateStripeFrame]");
    const iframe = await frame?.contentFrame();
    
    if(!iframe) {
        console.error("ERROR: iframe not found at fullStripeForm()");
        return;
    }

    await waitForSelector(iframe, "#Field-numberInput");

    await enterText(iframe, "#Field-numberInput", items.card);
    await enterText(iframe, "#Field-expiryInput", items.expiry);
    await enterText(iframe, "#Field-cvcInput", items.cvc);
    await enterText(iframe, "#Field-postalCodeInput", items.postalCode);

    await waitForSelector(page, ".payment:not(.loading)");

    await clickOn(page, "#confirm-payment");

    await waitForSelector(page, ".global-loading.full-page", 5);
}

export {
    fillStripeForm
}