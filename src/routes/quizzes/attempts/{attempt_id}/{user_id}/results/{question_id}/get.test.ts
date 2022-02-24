import { getMockRes } from "@jest-mock/express";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import QuizAttempt from "@models/quiz/attempt";
import Quiz from "@models/quiz/quiz";
import Role, { AccessKey } from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import { Request } from "express";
import QuizQuestion from "@models/quiz/question/question";
import QuizAnswer from "@models/quiz/question/answer";
import QuizSection from "@models/quiz/section";
import QuizResult from "@models/quiz/question/result";
import { unitTeardown } from "@test/unit/teardown";
import getController from "./get";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    quiz_id: number,
    quiz_section_id: number,
    quiz_question_id: number,
    quiz_answer_id: number,
    quiz_attempt_id: number,
    quizzedUserId: number;
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
            quiz_question_type_id: 1,
        })
    ));

    ({
        identifiers: [{ id: quiz_answer_id }],
    } = await conn.manager.insert(
        QuizAnswer,
        new QuizAnswer({
            quiz_question_id,
            updated_by_user_id: user_id,
            answer: "ANSWER",
            correct: true,
        })
    ));

    // setup secondary user for testing attempt getting
    ({
        identifiers: [{ id: quizzedUserId }],
    } = await conn.manager.insert(
        User,
        new User({
            first_name: "TEST123",
            last_name: "TEST123",
            email: "TEST123",
        })
    ));

    await conn.manager.insert(
        UserRole,
        new UserRole({
            role_id,
            user_id: quizzedUserId,
            updated_by_user_id: user_id,
        })
    );

    ({
        identifiers: [{ id: quiz_attempt_id }],
    } = await conn.manager.insert(
        QuizAttempt,
        new QuizAttempt({ quiz_id, user_id: quizzedUserId })
    ));

    await conn.manager.insert(
        QuizResult,
        new QuizResult({
            quiz_answer_id,
            quiz_attempt_id,
            quiz_question_id,
            updated_by_user_id: quizzedUserId,
        })
    );
});

afterAll(async () => {
    await unitTeardown(conn);
    await conn.close();
});

describe("user can get their own result", () => {
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

    test("view own result", async () => {
        await getController(
            {
                session: {
                    ...session,
                    user_id: quizzedUserId,
                },
                dbConnection: conn,
                params: {
                    attempt_id: quiz_attempt_id,
                    user_id: quizzedUserId,
                    question_id: quiz_question_id,
                },
            } as unknown as Request,
            res
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                quiz_attempt_id,
                quiz_answer_id,
                quiz_question_id,
            })
        );
    });

    test("view others' result", async () => {
        await getController(
            {
                session,
                dbConnection: conn,
                params: {
                    attempt_id: quiz_attempt_id,
                    user_id: quizzedUserId,
                    question_id: quiz_question_id,
                },
            } as unknown as Request,
            res
        );

        expect(res.sendStatus).toHaveBeenCalledWith(403);
    });
});

describe("admin/managers can view anyones", () => {
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
            await getController(
                {
                    session,
                    dbConnection: conn,
                    params: {
                        attempt_id: quiz_attempt_id,
                        user_id: quizzedUserId,
                        question_id: quiz_question_id,
                    },
                } as unknown as Request,
                res
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    quiz_attempt_id,
                    quiz_answer_id,
                    quiz_question_id,
                })
            );
        });
    });
});
