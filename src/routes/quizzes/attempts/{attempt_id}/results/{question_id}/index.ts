import { Router } from "express";
import postController from "./post";
import putController from "./put";

const router = Router();

router.post("/", postController);
router.put("/", putController);

export default router;
