import { Router } from "express";
import contentRouter from "./contents";
import deleteController from "./delete";
import getController from "./get";
import putController from "./put";

const router = Router({ mergeParams: true });

router.use("/contents", contentRouter);

router.get("/", getController);
router.put("/", putController);
router.delete("/", deleteController);

export default router;
