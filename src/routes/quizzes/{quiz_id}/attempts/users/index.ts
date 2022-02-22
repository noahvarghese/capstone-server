import { Router } from "express";
import idRouter from "./{id}";

const router = Router();

router.use("/:user_id", idRouter);

export default router;
