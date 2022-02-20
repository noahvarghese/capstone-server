import Manual from "@models/manual/manual";
import QuizQuestion from "@models/quiz/question/question";
import Quiz from "@models/quiz/quiz";
import QuizSection from "@models/quiz/section";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import { Request, Response } from "express";

const putController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        params: { id },
        dbConnection,
    } = req;

    let question: string;
    let quiz_question_type_id: number;

    try {
        const data = getJOpts(req.body, {
            question: { type: "string", required: false },
            quiz_question_type_id: { type: "number", required: false },
        });
        question = data.question as string;
        quiz_question_type_id = data.quiz_question_type_id as number;
    } catch (_e) {
        const { message } = _e as Error;
        res.status(400).send(message);
        return;
    }

    if (!question && !quiz_question_type_id) {
        res.sendStatus(400);
        return;
    }

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

    const quiz = await dbConnection
        .createQueryBuilder()
        .select("q")
        .from(Quiz, "q")
        .leftJoin(QuizSection, "qs", "q.id = qs.quiz_id")
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .where("qs.id = :id", { id })
        .andWhere("m.business_id = :current_business_id", {
            current_business_id,
        })
        .getOne();

    if (!quiz) {
        res.sendStatus(400);
        return;
    }

    if (quiz.prevent_edit) {
        res.sendStatus(405);
        return;
    }

    const prevQuestion = await dbConnection.manager.findOne(QuizQuestion, id);

    if (!prevQuestion) {
        res.sendStatus(400);
        return;
    }

    await dbConnection.manager.update(QuizQuestion, id, {
        question: question ?? prevQuestion.question,
        updated_by_user_id: user_id,
        quiz_question_type_id:
            quiz_question_type_id ?? prevQuestion.quiz_question_type_id,
    });

    res.sendStatus(200);
};

export default putController;
