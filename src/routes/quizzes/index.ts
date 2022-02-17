import authenticated from "@middleware/authenticated";
import { Router } from "express";
import idRouter from "./{id}";

const router = Router();

router.use(authenticated);

router.use("/:id", idRouter);

export default router;
