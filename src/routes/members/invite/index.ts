import { Router } from "express";
import { postController } from "./post_controller";

const router = Router();

router.post("/", postController);

export default router;
