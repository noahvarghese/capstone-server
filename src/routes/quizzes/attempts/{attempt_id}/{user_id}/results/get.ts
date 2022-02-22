import QuizAttempt from "@models/quiz/attempt";
import QuizResult from "@models/quiz/question/result";
import User from "@models/user/user";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        dbConnection,
        session: { user_id: logged_in_user_id, current_business_id },
        params: { user_id, attempt_id },
    } = req;

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, logged_in_user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, logged_in_user_id!),
    ]);

    if (!(isAdmin || isManager)) {
        if (logged_in_user_id !== Number(user_id)) {
            res.sendStatus(403);
        }
    }

    const result = await dbConnection
        .createQueryBuilder()
        .select("qr")
        .from(QuizResult, "qr")
        .leftJoin(QuizAttempt, "qa", "qa.id = qr.quiz_attempt_id")
        .where("qa.id = :attempt_id", { attempt_id })
        .andWhere("qa.user_id = :user_id", { user_id })
        .getMany();

    res.status(200).send(result);
};

export default getController;
