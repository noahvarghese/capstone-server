import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import QuizAnswer from "@models/quiz/question/answer";
import QuizQuestion from "@models/quiz/question/question";
import Quiz from "@models/quiz/quiz";
import QuizSection from "@models/quiz/section";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
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

    let query = dbConnection
        .createQueryBuilder()
        .select("qa")
        .from(QuizAnswer, "qa")
        .leftJoin(QuizQuestion, "qq", "qq.id = qa.quiz_question_id")
        .leftJoin(QuizSection, "qs", "qs.id = qq.quiz_section_id")
        .leftJoin(Quiz, "q", "q.id = qs.quiz_id")
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
        .leftJoin(UserRole, "ur", "ur.role_id = ma.role_id")
        .where("m.business_id = :current_business_id", { current_business_id })
        .andWhere("qa.id = :id", { id });

    // Additional filtering for basic users
    if (!(isAdmin || isManager)) {
        const isAssigned = await dbConnection
            .createQueryBuilder()
            .select("ma")
            .from(ManualAssignment, "ma")
            .leftJoin(Manual, "m", "m.id = ma.manual_id")
            .leftJoin(Quiz, "q", "q.manual_id = m.id")
            .leftJoin(QuizSection, "qs", "qs.quiz_id = q.id")
            .leftJoin(QuizQuestion, "qq", "qq.quiz_section_id = qs.id")
            .leftJoin(QuizAnswer, "qa", "qa.quiz_question_id = qq.id")
            .where("qa.id = :id", { id })
            .getOne();

        if (!isAssigned) {
            res.sendStatus(403);
            return;
        }

        query = query
            .andWhere("ur.user_id = :user_id", { user_id })
            .andWhere("q.published = :qPublished", {
                qPublished: true,
            })
            .andWhere("m.published = :mPublished", { mPublished: true });
    }

    const answer = await query.getOne();

    let result: Partial<QuizAnswer> | undefined = undefined;

    if (answer) {
        if (isAdmin || isManager) result = answer;
        else result = { ...answer, correct: undefined };
    }

    // Do not pass correct value to user
    res.status(200).send(result);
};

export default getController;
