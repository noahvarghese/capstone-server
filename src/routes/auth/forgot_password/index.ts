import { Router } from "express";
import { forgotPasswordController } from "./controller";

const router = Router();

router.post("/", forgotPasswordController);

export default router;
