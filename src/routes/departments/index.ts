import authenticated from "@middleware/authenticated";
import { Router } from "express";
import getController from "./get";
import idRouter from "./{id}";

const router = Router();

router.use(authenticated);
router.get("/", getController);
router.use("/:id", idRouter);

export default router;
