import { Router } from "express";
import userRouter from "./users";

const router = Router({ mergeParams: true });

router.use("/users", userRouter);

export default router;
