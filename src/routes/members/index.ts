import { Router } from "express";
import getController from "./get";
import idRouter from "./{id}";
import inviteRouter from "./invite";
import authenticated from "@middleware/authenticated";

const router = Router();

router.get("/", authenticated, getController);
router.use("/:id", authenticated, idRouter);
// authenticated performed at the method level within invite
router.use("/invite", inviteRouter);

export default router;
