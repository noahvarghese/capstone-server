import { Router } from "express";
import idRouter from "./{id}";
import policyRouter from "./policies";

const router = Router();

router.use("/:id", idRouter);
router.use("/policies", policyRouter);

export default router;
