import { Router } from "express";
import idRouter from "./{id}";
import questionRouter from "./questions";

const router = Router();

router.use("/:id", idRouter);
router.use("/questions", questionRouter);

export default router;
