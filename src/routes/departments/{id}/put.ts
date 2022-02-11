import Department from "@models/department";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";

const putController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { current_business_id, user_id },
        params: { id },
        dbConnection,
    } = req;

    if (!isNumber(id)) {
        res.sendStatus(400);
        return;
    }

    // despite checking in the middleware, we need to explicitly define these as numbers
    if (!isNumber(user_id) || !isNumber(current_business_id)) {
        res.sendStatus(401);
        return;
    }

    let name = "";

    try {
        const data = getJOpts(req.body, {
            name: { type: "string", required: true },
        });
        name = data.name as string;
    } catch (_e) {
        const { message } = _e as Error;
        res.status(400).send(message);
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

    if (!(await dbConnection.manager.findOne(Department, id))) {
        res.sendStatus(400);
        return;
    }

    await dbConnection.manager.update(
        Department,
        { id, business_id: current_business_id },
        {
            name,
            updated_by_user_id: user_id,
        }
    );
    res.sendStatus(200);
};
export default putController;
