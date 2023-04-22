import { ElementHandle, Page } from "puppeteer";
import { clickOn, waitForSelector } from "../puppeteer/other.js";




async function getItems(page: Page) {

    await waitForSelector(page, ".item-list");

    const list = await page.$$(".item-list a.app-item");

    return list;
}

async function addItemToCart(page: Page, id: string, amount: number) {
    await waitForSelector(page, `.item-list #${id}`);

    await clickOn(page, `.item-list #${id}`);

    await waitForSelector(page, ".item");

    await waitForSelector(page, "#add-item:not(:disabled)");

    for(let i = 0; i < amount; i++) {
        await clickOn(page, "#add-item");

        await waitForSelector(page, "#indicator-dish-added", 5);
    }
}

async function getRandomItemId(items: ElementHandle<Element>[]) {
    const index = Math.floor(Math.random() * items.length);

    const item = items[index];

    const idProperty = await item.getProperty("id");

    const id = await idProperty.jsonValue();

    return id;
}


export {
    getItems,
    addItemToCart,
    getRandomItemId,
}