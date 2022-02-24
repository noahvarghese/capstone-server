import { Router } from "express";
import resultRouter from "./results";

const router = Router();

router.use("/results", resultRouter);

export default router;
