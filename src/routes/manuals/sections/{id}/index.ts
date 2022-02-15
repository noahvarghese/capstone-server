import { Router } from "express";
import policyRouter from "./policies";
import getController from "./get";
import putController from "./put";

const router = Router();

router.use("/policies", policyRouter);

router.get("/", getController);
router.put("/", putController);

export default router;
