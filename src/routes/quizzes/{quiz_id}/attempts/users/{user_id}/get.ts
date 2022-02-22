import Manual from "@models/manual/manual";
import QuizAttempt from "@models/quiz/attempt";
import Quiz from "@models/quiz/quiz";
import User from "@models/user/user";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        dbConnection,
        session: { user_id: logged_in_user_id, current_business_id },
        params: { user_id, quiz_id },
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

    const attempts = await dbConnection
        .createQueryBuilder()
        .select("qa")
        .from(QuizAttempt, "qa")
        .leftJoin(Quiz, "q", "q.id = qa.quiz_id")
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .where("qa.user_id = :user_id", { user_id })
        .andWhere("q.id = :quiz_id", { quiz_id })
        .andWhere("m.business_id = :current_business_id", {
            current_business_id,
        })
        .getMany();

    res.status(200).send(attempts);
};

export default getController;
