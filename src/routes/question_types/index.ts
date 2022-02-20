import authenticated from "@middleware/authenticated";
import { Router } from "express";
import idRouter from "./{id}";
import getController from "./get";

const router = Router();

router.use(authenticated);
router.use("/:id", idRouter);

router.get("/", getController);

export default router;
