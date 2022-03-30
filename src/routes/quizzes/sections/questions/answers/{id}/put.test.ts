import { getMockRes, getMockReq } from "@jest-mock/express";
import Manual from "@models/manual/manual";
import QuizAnswer from "@models/quiz/question/answer";
import QuizQuestion from "@models/quiz/question/question";
import Quiz from "@models/quiz/quiz";
import QuizSection from "@models/quiz/section";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import putController from "./put";
import { Request } from "express";

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    quiz_id: number,
    quiz_section_id: number,
    quiz_question_id: number,
    quiz_answer_id: number;
let conn: Connection;
let session: Partial<SessionData>;
const NEW_ANSWER = "WHOS YOUR DADDY";
const OLD_ANSWER = "WHO AM I";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();

    ({ business_id, user_id } = await setupAdmin(conn));

    role_id = (await conn.manager.findOneOrFail(Role)).id;

    session = {
        user_id,
        current_business_id: business_id,
        business_ids: [business_id],
    };

    ({
        identifiers: [{ id: manual_id }],
    } = await conn.manager.insert(
        Manual,
        new Manual({
            title: "TEST",
            prevent_delete: false,
            prevent_edit: false,
            published: true,
            updated_by_user_id: user_id,
            business_id,
        })
    ));

    ({
        identifiers: [{ id: quiz_id }],
    } = await conn.manager.insert(
        Quiz,
        new Quiz({
            manual_id,
            max_attempts: 1,
            prevent_delete: false,
            prevent_edit: false,
            published: false,
            title: "TEST",
            updated_by_user_id: user_id,
        })
    ));

    ({
        identifiers: [{ id: quiz_section_id }],
    } = await conn.manager.insert(
        QuizSection,
        new QuizSection({
            quiz_id,
            title: "TEST",
            updated_by_user_id: user_id,
        })
    ));
    ({
        identifiers: [{ id: quiz_question_id }],
    } = await conn.manager.insert(
        QuizQuestion,
        new QuizQuestion({
            quiz_section_id,
            question: "WHO AM I",
            question_type: "multiple correct - multiple choice",
            updated_by_user_id: user_id,
        })
    ));

    ({
        identifiers: [{ id: quiz_answer_id }],
    } = await conn.manager.insert(
        QuizAnswer,
        new QuizAnswer({
            quiz_question_id,
            correct: false,
            answer: OLD_ANSWER,
            updated_by_user_id: user_id,
        })
    ));
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("prevent edit", () => {
    beforeAll(async () => {
        await conn.manager.update(Quiz, quiz_id, { prevent_edit: true });
    });
    afterAll(async () => {
        await conn.manager.update(Quiz, quiz_id, { prevent_edit: false });
    });

    test("", async () => {
        await putController(
            {
                session,
                dbConnection: conn,
                body: { answer: NEW_ANSWER },
                params: { id: quiz_answer_id },
            } as unknown as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenCalledWith(405);
    });
});

describe("Permissions", () => {
    const cases: AccessKey[] = ["ADMIN", "MANAGER", "USER"];

    afterEach(async () => {
        await conn.manager.update(QuizAnswer, quiz_answer_id, {
            answer: OLD_ANSWER,
        });
        await conn.manager.update(Role, role_id, {
            access: "ADMIN",
            prevent_edit: true,
        });
    });

    test.each(cases)("%p", async (access) => {
        await conn.manager.update(Role, () => "", {
            access: access,
            prevent_edit: false,
        });

        await putController(
            {
                session,
                dbConnection: conn,
                body: { answer: NEW_ANSWER },
                params: { id: quiz_answer_id },
            } as unknown as Request,
            res
        );

        const qa = await conn.manager.find(QuizAnswer);

        if (access !== "USER") {
            expect(res.sendStatus).toHaveBeenCalledWith(200);
            expect(qa[0].answer).toBe(NEW_ANSWER);
        } else {
            expect(res.sendStatus).toHaveBeenCalledWith(403);
            expect(qa[0].answer).toBe(OLD_ANSWER);
        }
    });
});

test("invalid answer", async () => {
    await putController(
        {
            session,
            dbConnection: conn,
            body: {},
            params: { id: quiz_answer_id },
        } as unknown as Request,
        res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Requires at least one argument");
});

describe("updating answer for 'true or false' question type", () => {
    let answerOneId: number, answerTwoId: number;

    beforeAll(async () => {
        await conn.manager.delete(QuizAnswer, quiz_answer_id);
        await conn.manager.update(QuizQuestion, quiz_question_id, {
            question_type: "true or false",
        });

        ({
            identifiers: [{ id: answerOneId }, { id: answerTwoId }],
        } = await conn.manager.insert(QuizAnswer, [
            new QuizAnswer({
                answer: "true",
                correct: false,
                updated_by_user_id: user_id,
                quiz_question_id,
            }),
            new QuizAnswer({
                answer: "false",
                correct: false,
                updated_by_user_id: user_id,
                quiz_question_id,
            }),
        ]));
    });

    afterAll(async () => {
        await conn.manager.delete(QuizAnswer, [answerOneId, answerTwoId]);
    });

    test("cannot change answer text", async () => {
        await putController(
            getMockReq({
                session,
                dbConnection: conn,
                body: { answer: "WRONG" },
                params: { id: answerOneId },
            }),
            res
        );

        expect(res.sendStatus).toHaveBeenCalledWith(405);
    });

    describe("one answer is set to correct", () => {
        beforeAll(async () => {
            await conn.manager.update(QuizAnswer, answerOneId, {
                correct: true,
            });
        });

        test("changing correct answer unsets previous correct answer", async () => {
            await putController(
                getMockReq({
                    session,
                    dbConnection: conn,
                    body: { correct: true },
                    params: { id: answerTwoId },
                }),
                res
            );

            expect(res.sendStatus).toHaveBeenCalledWith(200);

            const [answerOne, answerTwo] = await Promise.all([
                conn.manager.findOneOrFail(QuizAnswer, {
                    where: { id: answerOneId },
                }),
                conn.manager.findOneOrFail(QuizAnswer, {
                    where: { id: answerTwoId },
                }),
            ]);

            expect(answerOne?.correct).toBe(false);
            expect(answerTwo?.correct).toBe(true);
        });
    });
});

describe("updating answer for 'single correct - multiple choice", () => {
    let answerOneId: number, answerTwoId: number;

    beforeAll(async () => {
        await Promise.all([
            conn.manager.delete(QuizAnswer, { quiz_question_id }),
            conn.manager.update(QuizQuestion, quiz_question_id, {
                question_type: "single correct - multiple choice",
            }),
        ]);

        ({
            identifiers: [{ id: answerOneId }, { id: answerTwoId }],
        } = await conn.manager.insert(QuizAnswer, [
            new QuizAnswer({
                quiz_question_id,
                updated_by_user_id: user_id,
                answer: "test",
                correct: true,
            }),
            new QuizAnswer({
                quiz_question_id,
                updated_by_user_id: user_id,
                answer: "quiz",
                correct: false,
            }),
        ]));
    });

    test("changing correct answer unsets previous correct answer", async () => {
        await putController(
            getMockReq({
                session,
                dbConnection: conn,
                body: { correct: true },
                params: { id: answerTwoId },
            }),
            res
        );

        expect(res.sendStatus).toHaveBeenCalledWith(200);

        const [answerOne, answerTwo] = await Promise.all([
            conn.manager.findOneOrFail(QuizAnswer, {
                where: { id: answerOneId },
            }),
            conn.manager.findOneOrFail(QuizAnswer, {
                where: { id: answerTwoId },
            }),
        ]);

        expect(answerOne?.correct).toBe(false);
        expect(answerTwo?.correct).toBe(true);
    });
});
