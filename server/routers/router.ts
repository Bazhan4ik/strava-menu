import { Router } from "express";


const router = Router();

router.get("/", async (req, res) => {
    res.send({ hello: true });
});



export {
    router as Router
}

