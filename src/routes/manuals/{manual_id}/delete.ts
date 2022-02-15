import Manual from "@models/manual/manual";
import User from "@models/user/user";
import { Request, Response } from "express";

const deleteController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        params: { manual_id: id },
        dbConnection,
    } = req;

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, user_id!),
    ]);

    if (!(isAdmin || isManager)) {
        res.sendStatus(403);
        return;
    }

    const manual = await dbConnection
        .createQueryBuilder()
        .select("m")
        .from(Manual, "m")
        .where("m.business_id = :current_business_id", { current_business_id })
        .andWhere("m.id = :id", { id })
        .getOne();

    if (!manual) {
        res.sendStatus(400);
        return;
    } else if (manual.prevent_delete) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.delete(Manual, id);

    res.sendStatus(200);
};

export default deleteController;
