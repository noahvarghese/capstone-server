import Manual from "@models/manual/manual";
import Quiz from "@models/quiz/quiz";
import User from "@models/user/user";
import { Request, Response } from "express";

const deleteController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        params: { id },
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

    const q = await dbConnection
        .createQueryBuilder()
        .select("q")
        .from(Quiz, "q")
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .where("q.id = :id", { id })
        .andWhere("m.business_id = :business_id", {
            business_id: current_business_id,
        })
        .getOne();

    if (!q) {
        res.sendStatus(400);
        return;
    } else if (q.prevent_delete) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.delete(Quiz, id);

    res.sendStatus(200);
};

export default deleteController;
