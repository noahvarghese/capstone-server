import { Router } from "express";
import { loginController } from "./post";

const router = Router();

router.post("/", loginController);

export default router;
