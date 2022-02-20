import { Router } from "express";
import idRouter from "./{id}";
import answerRouter from "./answers";

const router = Router();

router.use("/:id", idRouter);
router.use("/answers", answerRouter);

export default router;
