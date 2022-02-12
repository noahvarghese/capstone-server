import Department from "@models/department";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
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

    if (!dbConnection || !dbConnection.isConnected) {
        res.sendStatus(500);
        return;
    }

    const isAdmin = await User.isAdmin(
        dbConnection,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        current_business_id!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        user_id!
    );

    if (!isAdmin) {
        res.sendStatus(403);
        return;
    }

    const dept = await dbConnection.manager.findOne(Department, id);

    if (!dept) {
        res.sendStatus(400);
        return;
    } else if (dept.prevent_edit) {
        res.sendStatus(405);
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
