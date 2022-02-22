import { Router } from "express";
import attemptRouter from "./attempts";

const router = Router();

router.use("/attempts", attemptRouter);

export default router;
