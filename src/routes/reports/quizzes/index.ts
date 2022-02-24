import { Router } from "express";
import incompleteRouter from "./incomplete";

const router = Router();

router.use("/incomplete", incompleteRouter);

export default router;
