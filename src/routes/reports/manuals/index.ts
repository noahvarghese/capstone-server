import { Router } from "express";
import unreadRouter from "./unread";

const router = Router();

router.use("/unread", unreadRouter);

export default router;
