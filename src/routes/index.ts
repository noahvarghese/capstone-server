import { Request, Response, Router } from "express";
import { client } from "../util/permalink";
import authRouter from "./auth";

const router = Router();

/* Uncomment after creating the other routes */
router.use("/auth", authRouter);

// Default route handler to serve the website if requests are made
router.use("/*", (req: Request, res: Response) => {
    res.redirect(client + (req.originalUrl !== "/" ? req.originalUrl : ""));
});

export default router;
