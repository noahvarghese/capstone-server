import authenticated from "@middleware/authenticated";
import { Router } from "express";
import getController from "./get";
import idRouter from "./{id}";
import quizRouter from "./{quiz_id}";
import attemptRouter from "./attempts";

const router = Router();

router.use(authenticated);

router.use("/:id", idRouter);
router.use("/:quiz_id", quizRouter);
router.use("/attempts", attemptRouter);

router.get("/", getController);

export default router;
