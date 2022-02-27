import { Router } from "express";
import { resetPasswordController } from "./post";

const router = Router({ mergeParams: true });

router.post("/:token", resetPasswordController);

export default router;
