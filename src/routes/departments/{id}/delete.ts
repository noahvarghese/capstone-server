import Department from "@models/department";
import User from "@models/user/user";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
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
