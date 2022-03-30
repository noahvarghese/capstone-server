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

    const prevAnswer = await dbConnection.manager.findOne(QuizAnswer, id);

    if (!prevAnswer) {
        res.status(400).send("No previous question");
        return;
    }

    const question = await dbConnection.manager.findOne(
        QuizQuestion,
        prevAnswer.quiz_question_id
    );

    if (question?.question_type === "true or false") {
        // cannot change answer text from defaults: 'true' or 'false'
        if (answer && answer !== prevAnswer.answer) {
            res.sendStatus(405);
            return;
        }
    }

    if (
        question?.question_type === "single correct - multiple choice" ||
        question?.question_type === "true or false"
    ) {
        // if changing correct answer
        if (correct && !prevAnswer.correct) {
            const answers = await dbConnection.manager.find(QuizAnswer, {
                where: { quiz_question_id: question.id },
            });

            const correctAnswer = answers.find((a) => a.correct);

            // if correct is already set, unset it
            if (correctAnswer) {
                await dbConnection.manager.update(
                    QuizAnswer,
                    correctAnswer.id,
                    { correct: false }
                );
            }
        }
    }

    await dbConnection.manager.update(QuizAnswer, id, {
        answer: answer ?? prevAnswer.answer,
        updated_by_user_id: user_id,
        correct: correct ?? prevAnswer.correct,
    });

    res.sendStatus(200);
};

export default putController;
