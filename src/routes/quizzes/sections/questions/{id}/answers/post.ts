import Manual from "@models/manual/manual";
import QuizAnswer from "@models/quiz/question/answer";
import QuizQuestion from "@models/quiz/question/question";
import Quiz from "@models/quiz/quiz";
import QuizSection from "@models/quiz/section";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import { Request, Response } from "express";

const postController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        params: { id },
        dbConnection,
    } = req;

    let answer: string;
    let correct: boolean;

    try {
        const data = getJOpts(req.body, {
            answer: { type: "string", required: true },
            correct: { type: "boolean", required: true },
        });
        answer = data.answer as string;
        correct = data.correct as boolean;
    } catch (_e) {
        const { message } = _e as Error;
        res.status(400).send(message);
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
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .leftJoin(QuizSection, "qs", "qs.quiz_id = q.id")
        .leftJoin(QuizQuestion, "qq", "qq.quiz_section_id = qs.id")
        .where("qq.id = :id", { id })
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

    await dbConnection.manager.insert(
        QuizAnswer,
        new QuizAnswer({
            answer,
            updated_by_user_id: user_id,
            correct,
            quiz_question_id: Number(id),
        })
    );

    res.sendStatus(201);
};

export default postController;
