import p from "puppeteer";
import { config } from "../../config.js";

async function createBrowser() {
    const browser = await p.launch({ headless: config.headless });

    const pages = await browser.pages();

    pages[0].setViewport({
        height: config.viewPort.height,
        width: config.viewPort.width,
    });

    return { browser, page: pages[0] };
}



export {
    createBrowser
}