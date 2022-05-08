import { Router } from "express";
import getController from "./get";

const router = Router({ mergeParams: true });

router.get("/", getController);

export default router;
