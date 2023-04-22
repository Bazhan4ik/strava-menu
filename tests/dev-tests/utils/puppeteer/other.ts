import { ElementHandle, Frame, Page } from "puppeteer";
import { config } from "../../config.js";




async function waitForSelector(elemen: Page | Frame, selector: string, retry = 0, timeout = config.time.selectorTimeout): Promise<ElementHandle<Element> | undefined> {
    try {
        await elemen.waitForSelector(selector, { timeout });
    } catch (e) {
        if(retry) {
            return waitForSelector(elemen, selector, retry - 1, timeout);
        }
        console.error(`ERROR: selector "${selector}" not found at "${elemen.url()}"`);
        if(config.throw.selector) {
            throw e;
        }
    }
}
async function enterText(page: Page | Frame, selector: string, value: string, delay = 10) {
    try {
        await page.type(selector, value, { delay });
    } catch (e) {
        console.error(`ERROR: can't enter "${value}" to "${selector}" at "${page.url()}"`);   
        if(config.throw.input) {
            throw e;
        }
    }
}
async function getInputValue(page: Page, selector: string) {
    try {
        const value = await page.$eval(selector, (input: Element) => (input as HTMLInputElement).value);
        
        return value;
    } catch (error) {
        console.error(`ERROR: can't get value of ${selector} at ${page.url()}`);
        if(config.throw.input) {
            throw error;
        }
    }
}
async function clickOn(page: Page, selector: string) {
    try {
        await page.click(selector);
    } catch (e) {
        console.error(`ERROR: can't click on "${selector}" at "${page.url()}"`);   
        if(config.throw.click) {
            throw e;
        }
    }
}


export {
    waitForSelector,
    getInputValue,
    enterText,
    clickOn,
}