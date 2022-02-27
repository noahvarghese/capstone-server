import { Router } from "express";
import roleIdRouter from "./{role_id}";
import getController from "./get";

const router = Router({ mergeParams: true });

router.use("/:role_id", roleIdRouter);

router.get("/", getController);

export default router;
