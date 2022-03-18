import { Router } from "express";
import { registerController } from "./post";

const router = Router({ mergeParams: true });

router.post("/", registerController);

export default router;
