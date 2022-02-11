import { Router } from "express";
import rolesRouter from "./roles";
import deleteController from "./delete";
import getController from "./get";

const router = Router();

router.use("/roles", rolesRouter);

router.get("/", getController);
router.delete("/", deleteController);

export default router;
