import { Router } from "express";
import idRouter from "./{id}";
import attemptIdRouter from "./{attempt_id}";

const router = Router({ mergeParams: true });

router.use("/:id", idRouter);
router.use("/:attempt_id", attemptIdRouter);

export default router;
