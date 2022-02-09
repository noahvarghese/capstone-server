import { Router } from "express";
import { sendInviteController } from "./post";

const router = Router();

router.post("/", sendInviteController);

export default router;
