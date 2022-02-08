import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import Logs from "@noahvarghese/logger";
import { ExpectedFormat, formatValidators } from "@util/format_checker";
import { Request, Response } from "express";

const options: ExpectedFormat = {
    email: {
        required: false,
        type: "string",
        format: "email",
    },
    first_name: { required: false, type: "string" },
    last_name: { required: false, type: "string" },
    phone: { required: false, type: "string", format: "phone" },
};

type UpdatedUser = Partial<
    Pick<User, "email" | "first_name" | "last_name" | "phone">
>;

export const updateUserController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        session: { user_id },
        dbConnection,
    } = req;

    let data: UpdatedUser;

    try {
        data = getJOpts(req.body, options, formatValidators) as UpdatedUser;
    } catch (_e) {
        const { message } = _e as Error;
        res.status(400).send(message);
        return;
    }

    try {
        await dbConnection.manager.update(User, user_id, data);
        res.sendStatus(200);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
    }
};
