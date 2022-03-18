import { Router } from "express";
import { setCurrentBusinessController } from "./post";
import { setDefaultBusinessController } from "./put";

const router = Router({ mergeParams: true });

router.post("/", setCurrentBusinessController);
router.put("/", setDefaultBusinessController);

export default router;
