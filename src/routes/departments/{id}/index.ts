import { Router } from "express";
import roleRouter from "./roles";
import deleteController from "./delete";
import getController from "./get";
import putController from "./put";

const router = Router();

router.get("/", getController);
router.put("/", putController);
router.delete("/", deleteController);

router.use("/roles", roleRouter);

export default router;
