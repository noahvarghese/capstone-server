import Manual from "@models/manual/manual";
import QuizAnswer from "@models/quiz/question/answer";
import QuizQuestion from "@models/quiz/question/question";
import Quiz from "@models/quiz/quiz";
import QuizSection from "@models/quiz/section";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import { Request, Response } from "express";

const formatter = {
    // FIXME: Bug in getJOpts requires formats to be defined for all keys if formatter provided
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    question: (_?: unknown) => true,
    question_type: (v?: unknown) =>
        [
            "true or false",
            "multiple correct - multiple choice",
            "single correct - multiple choice",
        ].includes(v as string),
};

const putController = async (req: Request, res: Response): Promise<void> => {
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
        const data = getJOpts(
            req.body,
            {
                question: {
                    type: "string",
                    required: false,
                    format: "question",
                },
                question_type: {
                    type: "string",
                    required: false,
                    format: "question_type",
                },
            },
            formatter
        );
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

    if (!question && !question_type) {
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
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .where("qq.id = :id", { id })
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

    const prevQuestion = await dbConnection.manager.findOne(QuizQuestion, id);

    if (!prevQuestion) {
        res.status(400).send("No previous question");
        return;
    }

    await dbConnection.manager.update(QuizQuestion, id, {
        question: question ?? prevQuestion.question,
        updated_by_user_id: user_id,
        question_type: question_type ?? prevQuestion.question_type,
    });

    // If question type CHANGES to 'true or false'
    if (
        prevQuestion.question_type !== "true or false" &&
        question_type === "true or false"
    ) {
        await dbConnection.manager.delete(QuizAnswer, { quiz_question_id: id });
        await dbConnection.manager.insert(QuizAnswer, [
            new QuizAnswer({
                updated_by_user_id: user_id,
                quiz_question_id: Number(id),
                answer: "true",
                correct: false,
            }),
            new QuizAnswer({
                updated_by_user_id: user_id,
                quiz_question_id: Number(id),
                answer: "false",
                correct: false,
            }),
        ]);
    }

    // TODO: If question changes from 'true or false' -> Delete all answers
    // TODO: If question changes from 'multiple correct - multiple choice' to 'single correct - multiple choice' -> Unset all correct

    res.sendStatus(200);
};

export default putController;
