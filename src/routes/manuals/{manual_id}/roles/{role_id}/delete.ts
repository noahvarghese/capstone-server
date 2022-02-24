import ManualAssignment from "@models/manual/assignment";
import Role from "@models/role";
import User from "@models/user/user";
import { Request, Response } from "express";

const deleteController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        params: { manual_id, role_id },
        dbConnection,
    } = req;

    // Permissions

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, user_id!),
    ]);

    const isManagerOfRole = await Role.hasManager(
        dbConnection,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        user_id!,
        Number(role_id)
    );

    if (!(isAdmin || isManager) || (isManager && !isManagerOfRole)) {
        res.sendStatus(403);
        return;
    }

    // Perform action

    await dbConnection.manager.delete(ManualAssignment, {
        manual_id: Number(manual_id),
        role_id: Number(role_id),
    });

    res.sendStatus(200);
};

export default deleteController;
