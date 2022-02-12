import authenticated from "@middleware/authenticated";
import { Router } from "express";
import getController from "./get";

const router = Router();

router.use(authenticated);

router.get("/", getController);

export default router;
