import User from "@models/user/user";
import { Request, Response } from "express";

export const getUserController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        session: { user_id },
        params: { id },
        dbConnection,
    } = req;

    if (user_id !== Number(id)) {
        res.sendStatus(403);
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
        birthday: user.birthday,
        email: user.email,
        phone: user.phone,
    });
};
