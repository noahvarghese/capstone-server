import User from "@models/user/user";
import { Request, Response } from "express";

export const getUserController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        session: { user_id },
        dbConnection,
    } = req;

    if (!dbConnection || !dbConnection.isConnected) {
        res.sendStatus(500);
        return;
    }

    const user = await dbConnection.manager.findOne(User, user_id);

    if (!user) {
        res.sendStatus(400);
        return;
    }

    res.status(200).send({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
    });
};
