import { Router } from "express";
import idRouter from "./{role_id}";
import getController from "./get";

const router = Router();

router.use("/:role_id", idRouter);
router.get("/", getController);

export default router;
