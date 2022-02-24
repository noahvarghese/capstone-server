import { Router } from "express";
import resultRouter from "./results";
import userIdRouter from "./{user_id}";

const router = Router();

router.use("/:user_id", userIdRouter);
router.use("/results", resultRouter);

export default router;
