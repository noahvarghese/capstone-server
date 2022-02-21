import { Router } from "express";
import sectionRouter from "./sections";
import attemptRouter from "./attempts";
import deleteController from "./delete";
import getController from "./get";
import putController from "./put";

const router = Router();

router.use("/sections", sectionRouter);
router.use("/attempts", attemptRouter);

router.get("/", getController);
router.put("/", putController);
router.delete("/", deleteController);

export default router;
