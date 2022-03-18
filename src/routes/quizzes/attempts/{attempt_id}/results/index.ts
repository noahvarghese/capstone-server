import { Router } from "express";
import questionIdRouter from "./{question_id}";

const router = Router({ mergeParams: true });

router.use("/:question_id", questionIdRouter);

export default router;
