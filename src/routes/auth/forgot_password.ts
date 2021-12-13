import { Request, Response, Router } from "express";
import User from "@models/user/user";
import { enablePasswordReset } from "@services/data/user";
import ServiceError, { dataServiceResponse } from "@util/errors/service";

const router = Router();

export const forgotPasswordRoute = async (
    req: Request,
    res: Response
): Promise<void> => {
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
        const { message, reason, field } = e as ServiceError;
        res.status(dataServiceResponse(reason)).json({
            message,
            field,
        });
    }
};

router.post("/", forgotPasswordRoute);

export default router;
