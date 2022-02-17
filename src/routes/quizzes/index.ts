import authenticated from "@middleware/authenticated";
import { Router } from "express";
import getController from "./get";
import idRouter from "./{id}";

const router = Router();

router.use(authenticated);

router.use("/:id", idRouter);

router.get("/", getController);

export default router;
