import { Router, Request, Response } from "express";

const router = Router();

// read specific user

// create user
router.post("/", async (req: Request, res: Response) => {
    console.log(req, res);
    res.sendStatus(200);
});

// update user

export default router;
