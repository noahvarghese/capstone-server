import { Router } from "express";
import questionIdRouter from "./{question_id}";

const router = Router();

router.use("/:question_id", questionIdRouter);

export default router;
