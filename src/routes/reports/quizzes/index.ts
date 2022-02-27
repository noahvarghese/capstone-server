import { Router } from "express";
import incompleteRouter from "./incomplete";
import attemptRouter from "./attempts";

const router = Router({ mergeParams: true });

router.use("/incomplete", incompleteRouter);
router.use("/attempts", attemptRouter);

export default router;
