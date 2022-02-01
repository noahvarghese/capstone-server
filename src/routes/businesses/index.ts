import { Router } from "express";
import { getBusinessController } from "./controllers";

const router = Router();

router.get("/", getBusinessController);

export default router;
