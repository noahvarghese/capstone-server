import { Router } from "express";
import incompleteRouter from "./incomplete";
import attemptRouter from "./attempts";

const router = Router();

router.use("/incomplete", incompleteRouter);
router.use("/attempts", attemptRouter);

export default router;
