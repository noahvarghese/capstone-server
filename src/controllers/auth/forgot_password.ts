import { Request, Response } from "express";
import { getConnection } from "typeorm";
import User from "@models/user/user";
import * as userService from "@services/data/user";
import ServiceError, { dataServiceResponse, ServiceErrorReasons } from "@util/errors/service";


const forgotPasswordValidator = async (email: string): Promise<void> => {
    const connection = getConnection();

    const userCount = await connection.manager.count(User, {
        where: { email },
    });

    if (userCount !== 1) {
        throw new ServiceError(
            "Invalid email",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "email"
        );
    }
};

const forgotPassword = async (
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

        await userService.password.enableReset(user);

        res.sendStatus(200);
    } catch (e) {
        const { message, reason, field } = e as ServiceError;
        res.status(dataServiceResponse(reason)).json({
            message,
            field,
        });
    }
};

export default forgotPassword;