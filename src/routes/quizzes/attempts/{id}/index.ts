import { Router } from "express";
import deleteController from "./delete";
import putController from "./put";

const router = Router({ mergeParams: true });

router.put("/", putController);
router.delete("/", deleteController);

export default router;
