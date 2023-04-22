import { Page } from "puppeteer";
import { config } from "../../config.js";



function getIframe(page: Page, name: string) {
    try {        
        const frames = page.frames();
    
        for(const frame of frames) {
            if(frame.name().slice(0, 20) == name) {
                return frame;
            }
        }
        return null;
    } catch (error) {
        console.error(`ERROR: can't get iframe with "${name}" name at ${page.url()}`);
        if(config.throw.iframe) {
            throw error;
        }
    }
}


export {
    getIframe
}