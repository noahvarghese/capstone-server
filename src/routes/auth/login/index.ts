import { Router } from "express";
import { loginController } from "./controller";

const router = Router();

router.post("/", loginController);

export default router;
