import { Router } from "express";
import getController from "./get";
import resultIdRouter from "./{result_id}";

const router = Router();

router.use("/:result_id", resultIdRouter);

router.get("/", getController);

export default router;
