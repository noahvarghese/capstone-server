import { Request, Response, Router } from "express";
import { client } from "../util/permalink";

const router = Router();

/* Uncomment after creating the other routes */
// router.use("/api", apiRouter);

// Default route handler to serve the website if requests are made
router.use("/*", (req: Request, res: Response) => {
    res.redirect(client + req.originalUrl);
});

export default router;
