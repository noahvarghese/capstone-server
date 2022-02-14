import authenticated from "@middleware/authenticated";
import { Router } from "express";
import idRouter from "./{manual_id}";
import getController from "./get";
import postController from "./post";

const router = Router();

router.use(authenticated);

router.use("/:manual_id", idRouter);

router.get("/", getController);
router.post("/", postController);

export default router;
