import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import QuizAttempt from "@models/quiz/attempt";
import Quiz from "@models/quiz/quiz";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import { Request, Response } from "express";

const postController = async (req: Request, res: Response): Promise<void> => {
    const {
        dbConnection,
        session: { user_id, current_business_id },
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

    // get quiz that is assigned and published, whose manual is also published
    const quiz = await dbConnection
        .createQueryBuilder()
        .select("q")
        .from(Quiz, "q")
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
        .leftJoin(UserRole, "ur", "ur.role_id = ma.role_id")
        .where("q.id = :id", { id })
        .andWhere("m.business_id = :current_business_id", {
            current_business_id,
        })
        .andWhere("m.published = :mPublished", { mPublished: true })
        .andWhere("q.published = :qPublished", { qPublished: true })
        .andWhere("ur.user_id = :user_id", { user_id })
        .getOne();

    // if no quiz
    // return 405
    if (!quiz) {
        res.sendStatus(405);
        return;
    }

    // get all current attempts for user
    // compare to max attempts for quiz
    const quizAttemptCount = await dbConnection.manager.count(QuizAttempt, {
        where: { quiz_id: id, user_id },
    });

    if (quizAttemptCount >= quiz.max_attempts) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.insert(
        QuizAttempt,
        // We can force the cast as we check if it is a number above
        new QuizAttempt({ user_id, quiz_id: Number(id) })
    );

    res.sendStatus(201);
};
export default postController;
