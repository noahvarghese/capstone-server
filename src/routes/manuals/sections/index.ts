import { Router } from "express";
import idRouter from "./{id}";
import contentRouter from "./contents";

const router = Router({ mergeParams: true });

router.use("/:id", idRouter);
router.use("/contents", contentRouter);

export default router;
