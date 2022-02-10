import authenticated from "@middleware/authenticated";
import { Router } from "express";
import { sendInviteController } from "./post";

const router = Router();

router.post("/", authenticated, sendInviteController);

export default router;
