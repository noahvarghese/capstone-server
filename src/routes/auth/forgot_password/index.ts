import { Router } from "express";
import { forgotPasswordController } from "./post";

const router = Router({ mergeParams: true });

router.post("/", forgotPasswordController);

export default router;
