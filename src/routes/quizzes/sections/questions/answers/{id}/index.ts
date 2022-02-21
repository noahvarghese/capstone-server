import { Router } from "express";
import getController from "./get";
import putController from "./put";

const router = Router();

router.get("/", getController);
router.put("/", putController);

export default router;
