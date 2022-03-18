import { Router } from "express";
import getController from "./get";
import idRouter from "./{user_id}";
import inviteRouter from "./invite";
import authenticated from "@middleware/authenticated";

const router = Router({ mergeParams: true });

// authenticated performed at the method level within invite
// Must be above using the auth middleware
router.use("/invite", inviteRouter);

router.get("/", authenticated, getController);
router.use("/:user_id", authenticated, idRouter);

export default router;
