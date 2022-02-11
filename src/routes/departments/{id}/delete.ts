import Department from "@models/department";
import User from "@models/user/user";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";

const deleteController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { current_business_id, user_id },
        params: { id },
        dbConnection,
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

    const dept = await dbConnection.manager.findOne(Department, id);

    if (!dept) {
        res.sendStatus(400);
        return;
    } else if (dept.prevent_delete) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.delete(Department, {
        business_id: current_business_id,
        id,
    });

    res.sendStatus(200);
};

export default deleteController;
