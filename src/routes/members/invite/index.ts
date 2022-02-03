import { Router } from "express";
import { sendInviteController } from "./post_controller";

const router = Router();

router.post("/", sendInviteController);

export default router;
