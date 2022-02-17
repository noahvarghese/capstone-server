import { Router } from "express";
import quizRouter from "./quizzes";
import roleRouter from "./roles";
import sectionRouter from "./sections";
import deleteController from "./delete";
import getController from "./get";
import putController from "./put";

const router = Router();

router.use("/quizzes", quizRouter);
router.use("/roles", roleRouter);
router.use("/sections", sectionRouter);

router.get("/", getController);
router.put("/", putController);
router.delete("/", deleteController);

export default router;
