import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import QuizAttempt from "@models/quiz/attempt";
import Quiz from "@models/quiz/quiz";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
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

    const result = await dbConnection
        .createQueryBuilder()
        .select("u")
        .addSelect("q")
        .from(User, "u")
        .leftJoin(UserRole, "ur", "ur.role_id = u.id")
        .leftJoin(ManualAssignment, "ma", "ma.role_id = ur.role_id")
        .leftJoin(Manual, "m", "m.id = ma.manual_id")
        .leftJoin(Quiz, "q", "q.manual_id = m.id")
        .leftJoin(QuizAttempt, "qa", "qa.quiz_id = q.id")
        .where("qa.user_id IS NULL")
        .andWhere("m.published = :mPub", { mPub: true })
        .andWhere("q.published = :qPub", { qPub: true })
        .andWhere("m.business_id = :current_business_id", {
            current_business_id,
        })
        .getRawMany<{
            u_id: number;
            u_first_name: string;
            u_last_name: string;
            q_title: string;
            q_id: number;
        }>();

    const usersWithUnfinishedQuizzes = result.reduce((prev, curr) => {
        const user = prev.find((p) => {
            return p.id === curr.u_id;
        });

        if (!user) {
            prev.push({
                id: curr.u_id,
                first_name: curr.u_first_name,
                last_name: curr.u_last_name,
                quizzes: [{ id: curr.q_id, title: curr.q_title }],
            });
            return prev;
        }

        user.quizzes.push({ id: curr.q_id, title: curr.q_title });
        return prev;
    }, [] as { id: number; first_name: string; last_name: string; quizzes: { id: number; title: string }[] }[]);

    res.status(200).send(usersWithUnfinishedQuizzes);
};

export default getController;
