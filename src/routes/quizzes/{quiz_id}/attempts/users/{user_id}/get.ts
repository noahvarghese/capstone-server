import Manual from "@models/manual/manual";
import QuizAttempt from "@models/quiz/attempt";
import QuizAnswer from "@models/quiz/question/answer";
import QuizQuestion from "@models/quiz/question/question";
import QuizResult from "@models/quiz/question/result";
import Quiz from "@models/quiz/quiz";
import QuizSection from "@models/quiz/section";
import User from "@models/user/user";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        dbConnection,
        session: { user_id: logged_in_user_id, current_business_id },
        params: { user_id, quiz_id },
    } = req;

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, logged_in_user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, logged_in_user_id!),
    ]);

    if (!(isAdmin || isManager)) {
        if (logged_in_user_id !== Number(user_id)) {
            res.sendStatus(403);
            return;
        }
    }

    const rawResults = await dbConnection
        .createQueryBuilder()
        .select("qa")
        .addSelect(
            "(SELECT COUNT(*) " +
                "FROM quiz_question qq " +
                "LEFT JOIN quiz_section qs ON qs.id = qq.quiz_section_id " +
                "LEFT JOIN quiz ON quiz.id = qs.quiz_id " +
                "WHERE quiz.id = q.id) AS total"
        )
        .from(QuizAttempt, "qa")
        .leftJoin(Quiz, "q", "q.id = qa.quiz_id")
        .leftJoin(Manual, "m", "m.id = q.manual_id")
        .where("qa.user_id = :user_id", { user_id })
        .andWhere("q.id = :quiz_id", { quiz_id })
        .andWhere("m.business_id = :current_business_id", {
            current_business_id,
        })
        .getRawMany<{
            qa_created_on: Date;
            qa_updated_on: Date;
            qa_deleted_on: Date | null;
            qa_id: number;
            qa_user_id: number;
            qa_quiz_id: number;
            total: number;
        }>();

    const resultWithScore = await Promise.all(
        rawResults.map(async (res) => {
            if (res.qa_created_on.getTime() === res.qa_updated_on.getTime())
                return { ...res, score: -1 };

            const results = await dbConnection.manager
                .createQueryBuilder()
                .select("qr")
                .from(QuizResult, "qr")
                .leftJoin(QuizAttempt, "qa", "qa.id = qr.quiz_attempt_id")
                .where("qa.id = :id", { id: res.qa_id })
                .getMany();

            const questions = await dbConnection.manager
                .createQueryBuilder()
                .select("qq")
                .from(QuizQuestion, "qq")
                .leftJoin(QuizSection, "qs", "qs.id = qq.quiz_section_id")
                .leftJoin(Quiz, "q", "q.id = qs.quiz_id")
                .where("q.id = :quiz_id", { quiz_id })
                .getMany();

            const answers = await dbConnection.manager
                .createQueryBuilder()
                .select("qa")
                .from(QuizAnswer, "qa")
                .leftJoin(QuizQuestion, "qq", "qq.id = qa.quiz_question_id")
                .leftJoin(QuizSection, "qs", "qs.id = qq.quiz_section_id")
                .leftJoin(Quiz, "q", "q.id = qs.quiz_id")
                .where("q.id = :quiz_id", { quiz_id })
                .getMany();

            const scores = questions.map(({ id: questionId }) => {
                // get all CORRECT answers for question
                const correctAnswerIds = answers
                    .filter((a) => a.quiz_question_id === questionId)
                    .filter((a) => a.correct)
                    .map((a) => a.id);

                const selectedAnswerIds = results
                    .filter((r) => r.quiz_question_id === questionId)
                    .map((a) => a.quiz_answer_id);

                if (selectedAnswerIds.length !== correctAnswerIds.length)
                    return 0;

                for (let i = 0; i < selectedAnswerIds.length; i++) {
                    if (!correctAnswerIds.includes(selectedAnswerIds[i])) {
                        return 0;
                    }
                }

                return 1;
            });

            const score = scores.reduce((prev, curr) => {
                return (prev += curr);
            }, 0 as number);

            return { ...res, score };
        })
    );

    const result = resultWithScore.map((r) => ({
        created_on: r.qa_created_on,
        updated_on: r.qa_updated_on,
        deleted_on: r.qa_deleted_on,
        id: r.qa_id,
        quiz_id: r.qa_quiz_id,
        score: Number(r.score),
        total: Number(r.total),
        user_id: r.qa_user_id,
    })) as (QuizAttempt & { score: number; total: number })[];

    res.status(200).send(result);
};

export default getController;
