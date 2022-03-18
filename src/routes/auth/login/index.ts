import { Router } from "express";
import { loginController } from "./post";

const router = Router({ mergeParams: true });

router.post("/", loginController);

export default router;
