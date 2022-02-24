import QuizAttempt from "@models/quiz/attempt";
import User from "@models/user/user";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import { Request, Response } from "express";

const putController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        dbConnection,
        params: { id },
    } = req;

    if (!isNumber(id)) {
        res.sendStatus(400);
        return;
    }

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, user_id!),
    ]);

    if (isAdmin || isManager) {
        res.sendStatus(403);
        return;
    }

    const quizAttempt = await dbConnection.manager.findOne(QuizAttempt, {
        id: Number(id),
        user_id,
    });

    if (!quizAttempt) {
        res.sendStatus(400);
        return;
    }

    if (quizAttempt.updated_on.getTime() !== quizAttempt.created_on.getTime()) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.update(QuizAttempt, id, {
        updated_on: new Date(),
    });

    res.sendStatus(200);
};

export default putController;
