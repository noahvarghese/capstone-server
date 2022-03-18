import { Router } from "express";
import questionRouter from "./questions";
import deleteController from "./delete";
import getController from "./get";
import putController from "./put";

const router = Router({ mergeParams: true });

router.use("/questions", questionRouter);

router.get("/", getController);
router.put("/", putController);
router.delete("/", deleteController);

export default router;
