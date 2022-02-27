import authenticated from "@middleware/authenticated";
import { Router } from "express";
import tokenRouter from "./{token}";
import { sendInviteController } from "./post";

const router = Router({ mergeParams: true });

router.post("/", authenticated, sendInviteController);
router.use("/:token", tokenRouter);

export default router;
