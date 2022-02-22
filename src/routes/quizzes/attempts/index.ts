import { Router } from "express";
import idRouter from "./{id}";
import userRouter from "./users";

const router = Router();

router.use("/:id", idRouter);
router.use("/users", userRouter);

export default router;
