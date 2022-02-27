import { Router } from "express";
import attemptRouter from "./attempts";

const router = Router({ mergeParams: true });

router.use("/attempts", attemptRouter);

export default router;
