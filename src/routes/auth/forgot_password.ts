import { Request, Response, Router } from "express";
import { enablePasswordReset } from "@services/data/user";
import ServiceError, { dataServiceResponse } from "@util/errors/service";
import { forgotPasswordValidator } from "@services/data/user/validators";
import { getConnection } from "typeorm";
import User from "@models/user/user";

const router = Router();

export const forgotPasswordRoute = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        body: { email },
    } = req;

    const connection = getConnection();

    try {
        await forgotPasswordValidator(email);

        const user = await connection.manager.findOneOrFail(User, {
            where: { email },
        });

        await enablePasswordReset(user);

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
