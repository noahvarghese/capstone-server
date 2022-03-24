import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import QuizQuestion from "@models/quiz/question/question";
import QuizQuestionType from "@models/quiz/question/question_type";
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
        .select(
            "qq.id, qq.question, qq.quiz_section_id, qq.quiz_question_type_id, qqt.question_type"
        )
        .from(QuizQuestion, "qq")
        .leftJoin(QuizQuestionType, "qqt", "qqt.id = qq.quiz_question_type_id")
        .leftJoin(QuizSection, "qs", "qs.id = qq.quiz_section_id")
        .leftJoin(Quiz, "q", "q.id = qs.quiz_id")
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
        .leftJoin(UserRole, "ur", "ur.role_id = ma.role_id")
        .where("m.business_id = :current_business_id", { current_business_id })
        .andWhere("qq.id = :id", { id });

    if (!(isAdmin || isManager)) {
        const isAssigned = await query
            .andWhere("ur.user_id = :user_id", { user_id })
            .getRawOne();

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

    const result = await query.getRawOne();

    res.status(200).send(result);
};

export default getController;
