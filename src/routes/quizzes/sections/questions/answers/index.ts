import { Router } from "express";
import idRouter from "./{id}";

const router = Router();

router.use("/:id", idRouter);

export default router;
