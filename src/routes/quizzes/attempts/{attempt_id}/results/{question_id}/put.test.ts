import { getMockRes } from "@jest-mock/express";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import QuizAttempt from "@models/quiz/attempt";
import Quiz from "@models/quiz/quiz";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import { Request } from "express";
import QuizAnswer from "@models/quiz/question/answer";
import QuizQuestion from "@models/quiz/question/question";
import QuizSection from "@models/quiz/section";
import putController from "./put";
import QuizResult from "@models/quiz/question/result";
import sleep from "@util/sleep";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    quiz_id: number,
    quiz_section_id: number,
    quiz_question_id: number,
    firstAnswer: number,
    secondAnswer: number,
    quiz_attempt_id: number;
let conn: Connection;
let session: Omit<SessionData, "cookie">;

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();

    ({ business_id, user_id } = await setupAdmin(conn));

    session = {
        user_id,
        business_ids: [business_id],
        current_business_id: business_id,
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

    role_id = (await conn.manager.findOneOrFail(Role)).id;

    await conn.manager.insert(
        ManualAssignment,
        new ManualAssignment({
            manual_id,
            updated_by_user_id: user_id,
            role_id,
        })
    );

    ({
        identifiers: [{ id: quiz_id }],
    } = await conn.manager.insert(
        Quiz,
        new Quiz({
            title: "TEST",
            prevent_delete: false,
            prevent_edit: false,
            published: true,
            max_attempts: 1,
            manual_id,
            updated_by_user_id: user_id,
        })
    ));

    ({
        identifiers: [{ id: quiz_section_id }],
    } = await conn.manager.insert(
        QuizSection,
        new QuizSection({
            quiz_id,
            updated_by_user_id: user_id,
            title: "SECTION",
        })
    ));

    ({
        identifiers: [{ id: quiz_question_id }],
    } = await conn.manager.insert(
        QuizQuestion,
        new QuizQuestion({
            quiz_section_id,
            updated_by_user_id: user_id,
            question: "QUESTION",
            question_type: "multiple correct - multiple choice",
        })
    ));

    ({
        identifiers: [{ id: firstAnswer }],
    } = await conn.manager.insert(
        QuizAnswer,
        new QuizAnswer({
            quiz_question_id,
            updated_by_user_id: user_id,
            answer: "ANSWER1",
            correct: true,
        })
    ));

    ({
        identifiers: [{ id: secondAnswer }],
    } = await conn.manager.insert(
        QuizAnswer,
        new QuizAnswer({
            quiz_question_id,
            updated_by_user_id: user_id,
            answer: "ANSWER2",
            correct: false,
        })
    ));

    ({
        identifiers: [{ id: quiz_attempt_id }],
    } = await conn.manager.insert(
        QuizAttempt,
        new QuizAttempt({ quiz_id, user_id })
    ));

    await conn.manager.insert(
        QuizResult,
        new QuizResult({
            quiz_answer_id: firstAnswer,
            quiz_attempt_id,
            quiz_question_id,
            updated_by_user_id: user_id,
        })
    );
});

afterAll(async () => {
    await unitTeardown(conn);
    await conn.close();
});

afterEach(async () => {
    await conn.manager.update(
        QuizResult,
        { quiz_question_id, quiz_attempt_id },
        { quiz_answer_id: firstAnswer }
    );
});

describe("only works for users", () => {
    beforeAll(async () => {
        await conn.manager.update(Role, role_id, {
            access: "USER",
            prevent_edit: false,
        });
    });

    afterAll(async () => {
        await conn.manager.update(Role, role_id, {
            access: "ADMIN",
            prevent_edit: true,
        });
    });

    describe("user", () => {
        test("success", async () => {
            await putController(
                {
                    dbConnection: conn,
                    session,
                    params: {
                        attempt_id: quiz_attempt_id,
                        question_id: quiz_question_id,
                    },
                    body: {
                        quiz_answer_id: secondAnswer,
                    },
                } as unknown as Request,
                res
            );

            const qr = await conn.manager.find(QuizResult);
            expect(qr.length).toBe(1);
            expect(res.sendStatus).toHaveBeenCalledWith(200);
            expect(qr[0]).toMatchObject(
                expect.objectContaining({
                    quiz_answer_id: secondAnswer,
                    quiz_question_id,
                    quiz_attempt_id,
                })
            );
        });
        describe("quiz attempt finished", () => {
            beforeAll(async () => {
                await sleep(2000);
                await conn.manager.update(QuizAttempt, quiz_attempt_id, {
                    updated_on: new Date(),
                });
            });

            afterAll(async () => {
                await conn.manager.delete(QuizAttempt, quiz_attempt_id);
                await conn.manager.delete(
                    QuizAttempt,
                    new QuizAttempt({ quiz_id, user_id })
                );
            });

            test("unsuccessful", async () => {
                await putController(
                    {
                        dbConnection: conn,
                        session,
                        params: {
                            attempt_id: quiz_attempt_id,
                            question_id: quiz_question_id,
                        },
                        body: {
                            quiz_answer_id: secondAnswer,
                        },
                    } as unknown as Request,
                    res
                );

                expect(res.sendStatus).toHaveBeenCalledWith(405);
            });
        });
    });
});

describe("access", () => {
    const p: AccessKey[] = ["ADMIN", "MANAGER"];

    describe.each(p)("%p", (access) => {
        beforeAll(async () => {
            await conn.manager.update(Role, role_id, {
                access,
                prevent_edit: false,
            });
        });

        afterAll(async () => {
            await conn.manager.update(Role, role_id, {
                access: "ADMIN",
                prevent_edit: true,
            });
        });

        test("success", async () => {
            await putController(
                {
                    session,
                    dbConnection: conn,
                    params: {
                        attempt_id: quiz_attempt_id,
                        question_id: quiz_question_id,
                    },
                    body: {
                        quiz_answer_id: secondAnswer,
                    },
                } as unknown as Request,
                res
            );

            expect(res.sendStatus).toHaveBeenCalledWith(403);
        });
    });
});
