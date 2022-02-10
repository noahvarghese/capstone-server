import { Router } from "express";
import getController from "./get";
import inviteRouter from "./invite";

const router = Router();

router.get("/", getController);
router.use("/invite", inviteRouter);

export default router;
