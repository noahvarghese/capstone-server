import { Request, Response, Router } from "express";
import { client } from "@util/permalink";
import authRouter from "./auth";
import memberRouter from "./members";
import manualRouter from "./manuals";
import businessRouter from "./businesses";
import departmentRouter from "./departments";
import reportRouter from "./reports";
import roleRouter from "./roles";
import questionTypeRouter from "./question_types";
import quizRouter from "./quizzes";
import userRouter from "./users";
import Logs from "@noahvarghese/logger";

const router = Router({ mergeParams: true });

router.use("/auth", authRouter);
router.use("/businesses", businessRouter);
router.use("/members", memberRouter);
router.use("/manuals", manualRouter);
router.use("/departments", departmentRouter);
router.use("/reports", reportRouter);
router.use("/roles", roleRouter);
router.use("/question_types", questionTypeRouter);
router.use("/quizzes", quizRouter);
router.use("/users", userRouter);

// Default route handler to serve the website if requests are made
router.use("/*", (req: Request, res: Response) => {
    Logs.Error("Invalid request to", req.originalUrl, req.method);

    let redirectURL = client();

    if (req.originalUrl !== "/") {
        if (req.originalUrl[0] === "/") {
            redirectURL += req.originalUrl.substring(1);
        }
    }
    res.redirect(redirectURL);
});

export default router;
