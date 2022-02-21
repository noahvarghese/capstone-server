import { Router } from "express";
import getController from "./get";
import putController from "./put";
import deleteController from "./delete";

const router = Router();

router.get("/", getController);
router.put("/", putController);
router.delete("/", deleteController);

export default router;
