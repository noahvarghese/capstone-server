import authenticated from "@middleware/authenticated";
import { Router } from "express";
import getController from "./get";
import idRouter from "./{id}";
import quizRouter from "./{quiz_id}";
import attemptRouter from "./attempts";
import sectionRouter from "./sections";

const router = Router({ mergeParams: true });

router.use(authenticated);

router.use("/:id", idRouter);
router.use("/:quiz_id", quizRouter);
router.use("/attempts", attemptRouter);
router.use("/sections", sectionRouter);

router.get("/", getController);

export default router;
