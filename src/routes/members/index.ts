import { Router } from "express";
import getController from "./get";
import idRouter from "./{user_id}";
import inviteRouter from "./invite";
import authenticated from "@middleware/authenticated";

const router = Router({ mergeParams: true });

router.get("/", authenticated, getController);
router.use("/:user_id", authenticated, idRouter);
// authenticated performed at the method level within invite
router.use("/invite", inviteRouter);

export default router;
