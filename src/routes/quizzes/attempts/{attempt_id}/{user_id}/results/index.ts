import { Router } from "express";
import resultIdRouter from "./{result_id}";

const router = Router();

router.use("/:result_id", resultIdRouter);

export default router;
