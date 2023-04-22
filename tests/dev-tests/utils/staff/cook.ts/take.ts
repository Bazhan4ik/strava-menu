import { ElementHandle, } from "puppeteer";


async function getDishByStatus(dishes: ElementHandle<Element>[], status: "ordered" | "cooking" | "disposing", closerTo: "start" | "end" = "start") {
    for(const el of dishes) {
        const clist = await el.getProperty("classList");
        const classList = await clist.jsonValue();

        const keys = Object.keys(classList);

        if(closerTo == "end") {
            keys.reverse();
        }

        for(const key of keys) {
            if(classList[key as unknown as any] == status) {
                return el;
            }
        }
    }
    return null;
}
async function getDishById(dishes: ElementHandle<Element>[], id: string) {
    for(const el of dishes) {
        const clist = await el.getProperty("classList");
        const classList = await clist.jsonValue();

        const keys = Object.keys(classList);

        for(const key of keys) {
            if(classList[key as unknown as any] == id) {
                return el;
            }
        }
    }
    return null;
}





export {
    getDishById,
    getDishByStatus,
}