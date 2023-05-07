import { Router } from "express";
import { ItemsRouter } from "./items.js";
import { CollectionsRouter } from "./collections.js";
import { SortingRouter } from "./sorting.js";


const router = Router({ mergeParams: true });


router.use("/items", ItemsRouter);
router.use("/collections", CollectionsRouter);
router.use("/sorting", SortingRouter);





export {
    router as MenuRouter,
}