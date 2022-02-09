import { Router } from "express";
import inviteRouter from "./invite";

const router = Router();

router.use("/invite", inviteRouter);

export default router;
