import { Router } from "express";
import { ItemsRouter } from "./items.js";
import { CollectionsRouter } from "./collections.js";
import { FoldersRouter } from "./folders.js";
import { SortingRouter } from "./sorting.js";


const router = Router({ mergeParams: true });


router.use("/items", ItemsRouter);
router.use("/collections", CollectionsRouter);
router.use("/folders", FoldersRouter);
router.use("/sorting", SortingRouter);





export {
    router as MenuRouter,
}