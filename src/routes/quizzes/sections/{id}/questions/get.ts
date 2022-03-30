import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
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
        .select("qq.id, qq.question, qq.quiz_section_id, qq.question_type")
        .from(QuizQuestion, "qq")
        .leftJoin(QuizSection, "qs", "qs.id = qq.quiz_section_id")
        .leftJoin(Quiz, "q", "q.id = qs.quiz_id")
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
        .leftJoin(UserRole, "ur", "ur.role_id = ma.role_id")
        .where("m.business_id = :current_business_id", { current_business_id })
        .andWhere("qs.id = :id", { id });

    // Additional filtering for basic users
    if (!(isAdmin || isManager)) {
        const isAssigned = await dbConnection
            .createQueryBuilder()
            .select("ma")
            .from(ManualAssignment, "ma")
            .leftJoin(Manual, "m", "m.id = ma.manual_id")
            .leftJoin(Quiz, "q", "q.manual_id = m.id")
            .leftJoin(QuizSection, "qs", "qs.quiz_id = q.id")
            .where("qs.id = :id", { id })
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

    const result = await query.getRawMany();

    res.status(200).send(result);
};

export default getController;
