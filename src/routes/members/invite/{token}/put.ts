import Membership from "@models/membership";
import User from "@models/user/user";
import getJOpts, { Expected } from "@noahvarghese/get_j_opts";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";
import { MoreThanOrEqual } from "typeorm";

const options: Expected = {
    first_name: {
        type: "string",
        required: false,
    },
    last_name: {
        type: "string",
        required: false,
    },
    password: {
        type: "string",
        required: false,
    },
    confirm_password: {
        type: "string",
        required: false,
    },
};

const putController = async (req: Request, res: Response): Promise<void> => {
    const {
        dbConnection,
        params: { token },
    } = req;

    let data: { [x in keyof typeof options]: string };

    try {
        data = getJOpts(req.body, options);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(400);
        return;
    }

    const dataExists =
        data.first_name &&
        data.last_name &&
        data.password &&
        data.confirm_password;

    if (dataExists) {
        if (data.password !== data.confirm_password) {
            res.sendStatus(400);
            return;
        }
    }

    const m = await dbConnection.manager.findOne(Membership, {
        where: {
            accepted: false,
            token,
            token_expiry: MoreThanOrEqual(new Date()),
        },
    });

    if (!m) {
        Logs.Error("No membership");
        res.sendStatus(400);
        return;
    }

    const u = await dbConnection.manager.findOne(User, {
        where: { id: m.user_id },
    });

    if (!u) {
        res.sendStatus(500);
        return;
    }

    // check if user has signed up (name/password)
    if (!(u.last_name || u.first_name) || !u.password) {
        // check if details sent
        if (!dataExists) {
            if (
                data.first_name ||
                data.last_name ||
                data.password ||
                data.confirm_password
            )
                res.sendStatus(400);
            else res.sendStatus(405);
            return;
        }
    }

    if (dataExists) {
        const { password } = await new User().hashPassword(data.password);
        const { first_name, last_name } = data;

        await dbConnection.manager.update(User, u.id, {
            first_name,
            last_name,
            password,
        });
    }

    // get all memberships for user
    const count = await dbConnection.manager.count(Membership, {
        where: { user_id: m.user_id },
    });

    // confirm accepted, remove token
    await dbConnection.manager.update(
        Membership,
        { token },
        {
            token: null,
            token_expiry: null,
            accepted: true,
            default_option: count === 1,
        }
    );

    res.sendStatus(200);
};

export default putController;
