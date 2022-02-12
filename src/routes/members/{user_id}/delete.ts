import Membership from "@models/membership";
import User from "@models/user/user";
import { Request, Response } from "express";

const deleteController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        dbConnection,
        params: { user_id: id },
    } = req;

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
