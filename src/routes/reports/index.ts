import authenticated from "@middleware/authenticated";
import { Router } from "express";
import adminRouter from "./admin";
import manualRouter from "./manuals";
import quizRouter from "./quizzes";

const router = Router();

router.use(authenticated);

router.use("/admin", adminRouter);
router.use("/manuals", manualRouter);
router.use("/quizzes", quizRouter);

export default router;
