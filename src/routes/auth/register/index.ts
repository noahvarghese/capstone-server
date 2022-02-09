import { Router } from "express";
import { registerController } from "./post";

const router = Router();

router.post("/", registerController);

export default router;
