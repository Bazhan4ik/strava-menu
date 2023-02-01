import { Router } from "express";
import { ingredients } from "../../resources/data/ingredients.js";
import { tags } from "../../resources/data/tags.js";
import { logged } from "../utils/middleware/auth.js";

const router = Router({ mergeParams: true });


router.get("/", async (req, res) => {
    res.send({ hello: true });
});


router.get("/ingredients", async (req, res) => {
    const { text } = req.query;

    if(typeof text != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    const results = [];
    for (const key of Object.keys(ingredients)) {
        const element = ingredients[key];
        for (let i = 0; i < element.length; i++) {
            if (element[i].title.toLowerCase().includes(text.toLowerCase())) {
                results.push(element[i]);
            }
        }
    }

    res.send(results);
});

router.get("/tags", async (req, res) => {
    const { text } = req.query;

    if(!text) {
        const result = [];
        for(let i of tags) {
            result.push({
                display: i.title,
                value: i.id,
            });
        }

        return res.send(result);
    }

    if(text && typeof text != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    const results = [];
    for (const tag of tags) {
        if(tag.title.toLowerCase().includes(text.toLowerCase())) {
            results.push({
                display: tag.title,
                value: tag.id,
            });
        }
    }

    res.send(results);
});








export {
    router as DataRouter,
}