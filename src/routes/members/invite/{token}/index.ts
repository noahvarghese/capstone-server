import { Router } from "express";
import putController from "./put";

const router = Router({ mergeParams: true });

router.put("/", putController);

export default router;
