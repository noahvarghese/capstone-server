import { Router } from "express";
import postController from "./post";

const router = Router();

router.post("/", postController);

export default router;
