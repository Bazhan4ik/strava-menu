import { Router } from "express";
import { DishesRouter } from "./dishes.js";
import { CollectionsRouter } from "./collections.js";
import { FoldersRouter } from "./folders.js";


const router = Router({ mergeParams: true });


router.use("/dishes", DishesRouter);
router.use("/collections", CollectionsRouter);
router.use("/folders", FoldersRouter);





export {
    router as MenuRouter,
}