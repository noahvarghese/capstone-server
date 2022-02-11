import { Router } from "express";
import { logoutController } from "./post";

const router = Router();

router.post("/", logoutController);

export default router;
