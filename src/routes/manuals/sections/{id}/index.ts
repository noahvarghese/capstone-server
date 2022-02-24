import { Router } from "express";
import contentRouter from "./contents";
import getController from "./get";
import putController from "./put";

const router = Router();

router.use("/contents", contentRouter);

router.get("/", getController);
router.put("/", putController);

export default router;
