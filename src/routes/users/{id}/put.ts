import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import { ExpectedBody, bodyValidators } from "@util/formats/body";
import { Request, Response } from "express";

const options: ExpectedBody = {
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

    if (!dbConnection || !dbConnection.isConnected) {
        res.sendStatus(500);
        return;
    }

    let data: UpdatedUser;

    try {
        data = getJOpts(req.body, options, bodyValidators) as UpdatedUser;
    } catch (_e) {
        const { message } = _e as Error;
        res.status(400).send(message);
        return;
    }

    await dbConnection.manager.update(User, user_id, data);
    res.sendStatus(200);
};
