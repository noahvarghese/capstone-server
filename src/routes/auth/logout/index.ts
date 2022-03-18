import { Router } from "express";
import { logoutController } from "./post";

const router = Router({ mergeParams: true });

router.post("/", logoutController);

export default router;
