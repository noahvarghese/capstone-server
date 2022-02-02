import { Router } from "express";
import { resetPasswordController } from "./controller";

const router = Router();

router.post("/:token", resetPasswordController);

export default router;
