import { Router } from "express";
import getController from "./get";

const router = Router();

router.get("/", getController);

export default router;
