import QuizAttempt from "@models/quiz/attempt";
import User from "@models/user/user";
import { Request, Response } from "express";

const deleteController = async (req: Request, res: Response): Promise<void> => {
    const {
        dbConnection,
        session: { user_id, current_business_id },
        params: { id },
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

    await dbConnection.manager.delete(QuizAttempt, id);

    res.sendStatus(200);
    return;
};

export default deleteController;
