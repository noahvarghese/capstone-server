import { Router } from "express";
import incompleteRouter from "./incomplete";
import attemptRouter from "./attempts";
import getController from "./get";

const router = Router({ mergeParams: true });

router.use("/incomplete", incompleteRouter);
router.use("/attempts", attemptRouter);
router.get("/", getController);

export default router;
