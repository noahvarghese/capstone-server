import { Router } from "express";
import {
    setCurrentBusinessController,
    setDefaultBusinessController,
} from "./controllers";
import middlewares from "./middlewares";

const router = Router();

router.use(middlewares);
router.post("/", setCurrentBusinessController);
router.put("/", setDefaultBusinessController);

export default router;
