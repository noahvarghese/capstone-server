import { Router } from "express";
import readRouter from "./read";
import deleteController from "./delete";
import getController from "./get";
import putController from "./put";

const router = Router({ mergeParams: true });

router.use("/read", readRouter);

router.get("/", getController);
router.put("/", putController);
router.delete("/", deleteController);

export default router;
