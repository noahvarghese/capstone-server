import Manual from "@models/manual/manual";
import QuizAttempt from "@models/quiz/attempt";
import Quiz from "@models/quiz/quiz";
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
        }
    }

    const attempts = (
        await dbConnection
            .createQueryBuilder()
            .select("qa")
            .addSelect(
                "(SELECT COUNT(*) " +
                    "FROM quiz_question qq " +
                    "LEFT JOIN quiz_section qs ON qs.id = qq.quiz_section_id " +
                    "LEFT JOIN quiz ON quiz.id = qs.quiz_id " +
                    "WHERE quiz.id = q.id) AS total"
            )
            .addSelect(
                "(SELECT CASE WHEN qa.created_on != qa.updated_on THEN " +
                    "(SELECT COUNT(*) FROM quiz_result qr " +
                    "LEFT JOIN quiz_attempt ON quiz_attempt.id = qr.quiz_attempt_id " +
                    "LEFT JOIN quiz_answer ON quiz_answer.id = qr.quiz_answer_id " +
                    "WHERE quiz_answer.correct = 1) " +
                    // -1 shows that the quiz attempt is still in progress
                    "ELSE -1 END FROM business) AS score"
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
                score: number;
            }>()
    ).map((r) => ({
        created_on: r.qa_created_on,
        updated_on: r.qa_updated_on,
        deleted_on: r.qa_deleted_on,
        id: r.qa_id,
        quiz_id: r.qa_quiz_id,
        score: Number(r.score),
        total: Number(r.total),
        user_id: r.qa_user_id,
    })) as (QuizAttempt & { score: number; total: number })[];

    res.status(200).send(attempts);
};

export default getController;
