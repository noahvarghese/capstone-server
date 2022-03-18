import { Router } from "express";
import resultRouter from "./results";

const router = Router({ mergeParams: true });

router.use("/results", resultRouter);

export default router;
