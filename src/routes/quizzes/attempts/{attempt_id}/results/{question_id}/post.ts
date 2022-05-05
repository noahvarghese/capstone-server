import QuizAttempt from "@models/quiz/attempt";
import QuizResult from "@models/quiz/question/result";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import { Request, Response } from "express";

// TODO: Allow multiple quiz_answer_ids
// To do this, we add the answer id as a concatenated primary key
// But add a check in the application to see if the question is multiple choice.
// If so we allow multiple answers

const postController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        params: { attempt_id, question_id },
        dbConnection,
    } = req;
    1;

    let quiz_answer_id: number;

    try {
        const data = getJOpts(req.body, {
            quiz_answer_id: { type: "number", required: true },
        });
        quiz_answer_id = data.quiz_answer_id as number;
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

    if (isAdmin || isManager) {
        res.sendStatus(403);
        return;
    }

    const quizAttempt = await dbConnection.manager.findOne(QuizAttempt, {
        where: { user_id, id: attempt_id },
    });

    if (!quizAttempt) {
        res.sendStatus(400);
        return;
    }

    if (quizAttempt.created_on.getTime() !== quizAttempt.updated_on.getTime()) {
        res.sendStatus(405);
        return;
    }

    await dbConnection.manager.insert(
        QuizResult,
        new QuizResult({
            quiz_attempt_id: Number(attempt_id),
            quiz_answer_id,
            quiz_question_id: Number(question_id),
            updated_by_user_id: user_id,
        })
    );

    res.sendStatus(201);
};

export default postController;
