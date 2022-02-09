import { Router } from "express";
import { forgotPasswordController } from "./post";

const router = Router();

router.post("/", forgotPasswordController);

export default router;
