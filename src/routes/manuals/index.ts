import authenticated from "@middleware/authenticated";
import { Router } from "express";
import getController from "./get";
import postController from "./post";

const router = Router();

router.use(authenticated);

router.get("/", getController);
router.post("/", postController);

export default router;
