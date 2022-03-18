import { Router } from "express";
import idRouter from "./{id}";

const router = Router({ mergeParams: true });

router.use("/:id", idRouter);

export default router;
