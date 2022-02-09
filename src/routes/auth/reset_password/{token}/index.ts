import { Router } from "express";
import { resetPasswordController } from "./post";

const router = Router();

router.post("/:token", resetPasswordController);

export default router;
