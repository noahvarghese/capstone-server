import { Router } from "express";
import deleteController from "./delete";
import getController from "./get";
import putController from "./put";

const router = Router();

router.get("/", getController);
router.put("/", putController);
router.delete("/", deleteController);

export default router;
