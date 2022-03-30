import Manual from "@models/manual/manual";
import QuizAnswer from "@models/quiz/question/answer";
import { Request, Response } from "express";
import QuizQuestion from "@models/quiz/question/question";
import QuizSection from "@models/quiz/section";
import Quiz from "@models/quiz/quiz";
import User from "@models/user/user";

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

    const query = dbConnection
        .createQueryBuilder()
        .select("q")
        .from(Quiz, "q")
        .leftJoin(QuizSection, "qs", "q.id = qs.quiz_id")
        .leftJoin(QuizQuestion, "qq", "qs.id = qq.quiz_section_id")
        .leftJoin(QuizAnswer, "qa", "qq.id = qa.quiz_question_id")
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .where("qa.id = :id", { id })
        .andWhere("m.business_id = :current_business_id", {
            current_business_id,
        });

    const quiz = await query.getOne();

    if (!quiz) {
        res.sendStatus(400);
        return;
    }

    if (quiz.prevent_edit) {
        res.sendStatus(405);
        return;
    }
    const answer = await dbConnection.manager.findOne(QuizAnswer, id);

    if (!answer) {
        res.sendStatus(200);
        return;
    }
    const question = await dbConnection.manager.findOne(
        QuizQuestion,
        answer.quiz_question_id
    );

    // cannot delete answers for true or false questions (NOT ALLOWED)
    if (question?.question_type === "true or false") {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.delete(QuizAnswer, id);

    res.sendStatus(200);
};

export default deleteController;
