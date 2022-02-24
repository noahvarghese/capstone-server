import { Router } from "express";
import answerRouter from "./answers";
import deleteController from "./delete";
import getController from "./get";
import putController from "./put";

const router = Router();

router.use("/answers", answerRouter);

router.get("/", getController);
router.put("/", putController);
router.delete("/", deleteController);

export default router;
