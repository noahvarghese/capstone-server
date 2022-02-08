import User from "@models/user/user";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";

export const getUserController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        session: { user_id },
        dbConnection,
    } = req;

    try {
        const user = await dbConnection.manager.findOne(User, user_id);

        if (!user) res.sendStatus(400);
        else
            res.status(200).send({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
            });
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
    }
};
