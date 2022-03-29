import Manual from "@models/manual/manual";
import QuizAnswer from "@models/quiz/question/answer";
import getJOpts from "@noahvarghese/get_j_opts";
import { Request, Response } from "express";
import QuizQuestion from "@models/quiz/question/question";
import QuizSection from "@models/quiz/section";
import Quiz from "@models/quiz/quiz";
import User from "@models/user/user";

const putController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        params: { id },
        dbConnection,
    } = req;

    let answer: string;
    let correct: boolean;

    try {
        const data = getJOpts(req.body, {
            answer: { type: "string", required: false },
            correct: { type: "boolean", required: false },
        });
        answer = data.answer as string;
        correct = data.correct as boolean;
    } catch (_e) {
        const { message } = _e as Error;
        res.status(400).send(message);
        return;
    }

    if (!answer && correct === undefined) {
        res.status(400).send("Requires at least one argument");
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

    // TODO: If question type is 'true or false' and answer text is being changed return 405

    // TODO: If question type === 'single correct - multiple choice' unset the previously correct and update the new one to correct

    const prevAnswer = await dbConnection.manager.findOne(QuizAnswer, id);

    if (!prevAnswer) {
        res.status(400).send("No previous question");
        return;
    }

    await dbConnection.manager.update(QuizAnswer, id, {
        answer: answer ?? prevAnswer.answer,
        updated_by_user_id: user_id,
        correct: correct ?? prevAnswer.correct,
    });

    res.sendStatus(200);
};

export default putController;
