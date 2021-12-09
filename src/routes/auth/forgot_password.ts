import { Request, Response, Router } from "express";
import User from "@models/user/user";
import { enablePasswordReset } from "@services/data/user";
import ServiceError from "@util/errors/service_error";

const router = Router();

export const forgotPasswordRoute = async (req: Request, res: Response): Promise<void> => {
    const {
        SqlConnection,
        body: { email },
    } = req;

    const user = await SqlConnection.manager.findOne(User, {
        where: { email },
    });

    if (!user) {
        res.status(400).json({ message: "Invalid email" });
        return;
    }

    try {
        await enablePasswordReset(SqlConnection, user);
        res.sendStatus(200);
    } catch (e) {
        const { message } = e as Error;
        res.status(e instanceof ServiceError ? e.reason : 500).json({
            message,
        });
    }
}

router.post("/",forgotPasswordRoute);

export default router;
