import { Router } from "express";
import putController from "./put";

const router = Router();

router.put("/", putController);

export default router;
