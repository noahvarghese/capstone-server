import { Router } from "express";
import { logoutController } from "./controller";

const router = Router();

router.post("/", logoutController);

export default router;
