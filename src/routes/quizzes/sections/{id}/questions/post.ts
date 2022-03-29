import Manual from "@models/manual/manual";
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

    let question: string;
    let question_type:
        | "true or false"
        | "multiple correct - multiple choice"
        | "single correct - multiple choice";

    try {
        const data = getJOpts(req.body, {
            question: { type: "string", required: true },
            question_type: { type: "string", required: true },
        });
        question = data.question as string;
        question_type = data.question_type as
            | "true or false"
            | "multiple correct - multiple choice"
            | "single correct - multiple choice";
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

    // TODO: If quiz type === 'true or false' -> Create quiz answers [{answer: true, correct: false}, {answer: false, correct: false}]

    const quiz = await dbConnection
        .createQueryBuilder()
        .select("q")
        .from(Quiz, "q")
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .leftJoin(QuizSection, "qs", "qs.quiz_id = q.id")
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

    await dbConnection.manager.insert(
        QuizQuestion,
        new QuizQuestion({
            question,
            updated_by_user_id: user_id,
            quiz_section_id: Number(id),
            question_type,
        })
    );

    res.sendStatus(201);
    return;
};

export default postController;
