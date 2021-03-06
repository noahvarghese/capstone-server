import { Router } from "express";
import getController from "./get";
import questionIdRouter from "./{question_id}";

const router = Router({ mergeParams: true });

router.use("/:question_id", questionIdRouter);

router.get("/", getController);

export default router;
