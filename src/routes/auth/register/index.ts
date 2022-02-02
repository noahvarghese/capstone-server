import { Router } from "express";
import { registerController } from "./controller";

const router = Router();

router.post("/", registerController);

export default router;
