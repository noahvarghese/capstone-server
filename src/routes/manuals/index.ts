import authenticated from "@middleware/authenticated";
import { Router } from "express";

const router = Router();

router.use(authenticated);

export default router;
