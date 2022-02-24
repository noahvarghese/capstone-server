import { getMockRes } from "@jest-mock/express";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import QuizQuestion from "@models/quiz/question/question";
import Quiz from "@models/quiz/quiz";
import QuizSection from "@models/quiz/section";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import getController from "./get";
import { Request } from "express";
import QuizAnswer from "@models/quiz/question/answer";

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    quiz_id: number,
    quiz_section_id: number,
    quiz_question_id: number,
    quiz_answer_id: number;
let conn: Connection;
let session: Omit<SessionData, "cookie">;

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
            quiz_question_type_id: 1,
            question: "WHO AM I",
            updated_by_user_id: user_id,
        })
    ));

    ({
        identifiers: [{ id: quiz_answer_id }],
    } = await conn.manager.insert(
        QuizAnswer,
        new QuizAnswer({
            quiz_question_id,
            answer: "WHO AM I",
            correct: false,
            updated_by_user_id: user_id,
        })
    ));
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("assigned", () => {
    const a = [true, false];

    describe.each(a)("assigned: %p", (assigned) => {
        const m = [true, false];

        beforeAll(async () => {
            if (!assigned) {
                await conn.manager.delete(ManualAssignment, {
                    role_id,
                    manual_id,
                });
            } else {
                await conn.manager.insert(
                    ManualAssignment,
                    new ManualAssignment({
                        role_id,
                        manual_id,
                        updated_by_user_id: user_id,
                    })
                );
            }
        });

        describe.each(m)("manual published: %p", (manual_published) => {
            const q = [true, false];

            beforeAll(async () => {
                await conn.manager.update(Manual, manual_id, {
                    published: manual_published,
                });
            });

            describe.each(q)("quiz published: %p", (quiz_published) => {
                beforeAll(async () => {
                    await conn.manager.update(Quiz, quiz_id, {
                        published: quiz_published,
                    });
                });

                const permissions: AccessKey[] = ["ADMIN", "MANAGER", "USER"];

                describe.each(permissions)("%p", (access) => {
                    beforeAll(async () => {
                        await conn.manager.update(Role, role_id, {
                            access: access,
                            prevent_edit: false,
                        });
                    });

                    afterAll(async () => {
                        await conn.manager.update(Role, role_id, {
                            access: "ADMIN",
                            prevent_edit: true,
                        });
                    });

                    test("", async () => {
                        await getController(
                            {
                                session,
                                dbConnection: conn,
                                params: { id: quiz_answer_id },
                            } as unknown as Request,
                            res
                        );

                        if (access === "USER") {
                            if (!assigned) {
                                expect(res.sendStatus).toHaveBeenCalledWith(
                                    403
                                );
                            } else {
                                expect(res.status).toHaveBeenCalledWith(200);
                                if (!quiz_published || !manual_published) {
                                    expect(res.send).toHaveBeenCalledWith(
                                        undefined
                                    );
                                } else {
                                    expect(res.send).toHaveBeenCalledWith(
                                        expect.objectContaining({
                                            quiz_question_id,
                                            id: quiz_answer_id,
                                        })
                                    );
                                }
                            }
                        } else {
                            expect(res.status).toHaveBeenCalledWith(200);
                            expect(res.send).toHaveBeenCalledWith(
                                expect.objectContaining({
                                    id: quiz_answer_id,
                                    quiz_question_id,
                                })
                            );
                        }
                    });
                });
            });
        });
    });
});
