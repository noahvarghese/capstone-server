import { Router } from "express";
import userIdRouter from "./{user_id}";

const router = Router();

router.use("/:user_id", userIdRouter);

export default router;
