import navRoute from "./nav";
import { Router } from "express";

const router = Router();

router.use("/nav", navRoute);

export default router;
