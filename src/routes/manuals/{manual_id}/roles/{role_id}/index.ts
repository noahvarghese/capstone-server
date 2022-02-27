import { Router } from "express";
import deleteController from "./delete";
import postController from "./post";

const router = Router({ mergeParams: true });

router.post("/", postController);
router.delete("/", deleteController);

export default router;
