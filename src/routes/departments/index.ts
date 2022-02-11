import authenticated from "@middleware/authenticated";
import { Router } from "express";
import getController from "./get";
import postController from "./post";
import idRouter from "./{id}";

const router = Router();

router.use(authenticated);
router.get("/", getController);
router.post("/", postController);
router.use("/:id", idRouter);

export default router;
