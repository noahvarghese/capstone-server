import { Router } from "express";
import deleteController from "./delete";
import getController from "./get";

const router = Router();

router.get("/", getController);
router.delete("/", deleteController);

export default router;
