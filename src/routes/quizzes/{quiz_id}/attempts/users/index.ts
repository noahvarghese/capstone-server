import { Router } from "express";
import idRouter from "./{user_id}";

const router = Router({ mergeParams: true });

router.use("/:user_id", idRouter);

export default router;
