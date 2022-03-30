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
import { Request } from "express";
import getController from "./get";

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    quiz_id: number,
    quiz_section_id: number,
    quiz_question_id: number;
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
            question_type: "multiple correct - multiple choice",
            question: "WHATS MY NAME",
            updated_by_user_id: user_id,
        })
    ));
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("assigned", () => {
    // manual assigned
    const a = [true, false];

    describe.each(a)("%p", (assigned) => {
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

        // manual Published
        const mP = [true, false];

        describe.each(mP)("manual published: %p", (manualPublished) => {
            beforeAll(async () => {
                await conn.manager.update(Manual, manual_id, {
                    published: manualPublished,
                });
            });

            // quiz published
            const qP = [true, false];

            describe.each(qP)("quiz published: %p", (quizPublished) => {
                beforeAll(async () => {
                    await conn.manager.update(Quiz, quiz_id, {
                        published: quizPublished,
                    });
                });

                const perm: AccessKey[] = ["ADMIN", "MANAGER", "USER"];

                describe.each(perm)("permissions: %p", (access) => {
                    beforeAll(async () => {
                        await conn.manager.update(Role, role_id, {
                            access: access as AccessKey,
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
                                params: { id: quiz_section_id },
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
                                if (!quizPublished || !manualPublished) {
                                    expect(res.send).toHaveBeenCalledWith(
                                        expect.arrayContaining([])
                                    );
                                } else {
                                    expect.arrayContaining([
                                        expect.objectContaining({
                                            quiz_section_id,
                                            id: quiz_question_id,
                                        }),
                                    ]);
                                }
                            }
                        } else {
                            expect(res.status).toHaveBeenCalledWith(200);
                            expect(res.send).toHaveBeenCalledWith(
                                expect.arrayContaining([
                                    expect.objectContaining({
                                        quiz_section_id,
                                        id: quiz_question_id,
                                    }),
                                ])
                            );
                        }
                    });
                });
            });
        });
    });
});
