import { Router } from "express";
import unreadRouter from "./unread";

const router = Router({ mergeParams: true });

router.use("/unread", unreadRouter);

export default router;
