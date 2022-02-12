import Department from "@models/department";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import { Request, Response } from "express";

const putController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { current_business_id, user_id },
        params: { id },
        dbConnection,
    } = req;

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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!(await User.isAdmin(dbConnection, current_business_id!, user_id!))) {
        res.sendStatus(403);
        return;
    }

    const dept = await dbConnection.manager.findOne(Department, {
        where: { id, business_id: current_business_id },
    });

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
