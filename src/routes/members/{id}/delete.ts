import Membership from "@models/membership";
import User from "@models/user/user";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";

const deleteController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        dbConnection,
        params: { id },
    } = req;

    if (!isNumber(id)) {
        res.sendStatus(400);
        return;
    }

    try {
        const isAdmin = await User.isAdmin(
            dbConnection,
            current_business_id ?? NaN,
            user_id ?? NaN
        );

        if (!isAdmin) {
            res.sendStatus(403);
            return;
        }
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
        return;
    }

    const membership = await dbConnection.manager.findOne(Membership, {
        where: { user_id: id, business_id: current_business_id },
    });

    if (!membership) {
        res.sendStatus(400);
        return;
    }

    if (membership.prevent_delete) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.delete(Membership, membership);

    res.sendStatus(200);
    return;
};

export default deleteController;
