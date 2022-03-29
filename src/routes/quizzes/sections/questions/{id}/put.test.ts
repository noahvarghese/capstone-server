import { getMockRes } from "@jest-mock/express";
import Manual from "@models/manual/manual";
import Quiz from "@models/quiz/quiz";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import { Request } from "express";
import QuizSection from "@models/quiz/section";
import QuizQuestion from "@models/quiz/question/question";
import putController from "./put";
import QuizAnswer from "@models/quiz/question/answer";

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    quiz_id: number,
    quiz_section_id: number,
    quiz_question_id: number;
let conn: Connection;
let session: Omit<SessionData, "cookie">;
const NEW_QUESTION = "WHOS YOUR DADDY";
const OLD_QUESTION = "WHO AM I";

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
            question: OLD_QUESTION,
            question_type: "multiple correct - multiple choice",
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
        await conn.manager.update(QuizQuestion, quiz_question_id, {
            question: OLD_QUESTION,
        });
    });

    test("", async () => {
        await putController(
            {
                session,
                dbConnection: conn,
                body: { question: NEW_QUESTION },
                params: { id: quiz_question_id },
            } as unknown as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenCalledWith(405);
    });
});

describe("Permissions", () => {
    const cases = ["ADMIN", "MANAGER", "USER"];

    afterEach(async () => {
        await conn.manager.update(QuizQuestion, quiz_question_id, {
            question: OLD_QUESTION,
        });
        await conn.manager.update(Role, role_id, {
            access: "ADMIN",
            prevent_edit: true,
        });
    });

    test.each(cases)("%p", async (access) => {
        await conn.manager.update(Role, () => "", {
            access: access as AccessKey,
            prevent_edit: false,
        });

        await putController(
            {
                session,
                dbConnection: conn,
                body: { question: NEW_QUESTION },
                params: { id: quiz_question_id },
            } as unknown as Request,
            res
        );

        const qq = await conn.manager.find(QuizQuestion);

        if (access !== "USER") {
            expect(res.sendStatus).toHaveBeenCalledWith(200);
            expect(qq[0].question).toBe(NEW_QUESTION);
        } else {
            expect(res.sendStatus).toHaveBeenCalledWith(403);
            expect(qq[0].question).toBe(OLD_QUESTION);
        }
    });
});

test("invalid question", async () => {
    await putController(
        {
            session,
            dbConnection: conn,
            body: {},
            params: { id: quiz_question_id },
        } as unknown as Request,
        res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Requires at least one argument");
});

describe("changing question type to 'true or false' resets questions", () => {
    beforeEach(async () => {
        const question = await conn.manager.findOne(
            QuizQuestion,
            quiz_question_id
        );

        // unset question type
        if (question?.question_type === "true or false") {
            await conn.manager.update(QuizQuestion, quiz_question_id, {
                question_type: "multiple correct - multiple choice",
            });
        }

        const answers = await conn.manager.find(QuizAnswer, {
            where: { quiz_question_id },
        });

        // ensure at least one answer
        if (answers.length === 0) {
            await conn.manager.insert(
                QuizAnswer,
                new QuizAnswer({
                    answer: "test",
                    correct: true,
                    updated_by_user_id: user_id,
                    quiz_question_id,
                })
            );
        }
    });

    test("success", async () => {
        await putController(
            {
                session,
                dbConnection: conn,
                body: { question_type: "true or false" },
                params: { id: quiz_question_id },
            } as unknown as Request,
            res
        );

        const answers = await conn.manager.find(QuizAnswer, {
            where: { quiz_question_id },
        });

        expect(answers.length).toBe(2);

        expect(answers[0].correct).toBe(false);
        expect(answers[1].correct).toBe(false);

        expect(answers.find((a) => a.answer === "true")).not.toBe(undefined);
        expect(answers.find((a) => a.answer === "false")).not.toBe(undefined);
    });
});

describe("changing question from 'tru or false' deletes answers", () => {
    beforeAll(async () => {
        const question = await conn.manager.findOne(
            QuizQuestion,
            quiz_question_id
        );

        if (question?.question_type !== "true or false") {
            await conn.manager.update(QuizQuestion, quiz_question_id, {
                question_type: "true or false",
            });
            await conn.manager.delete(QuizAnswer, { quiz_question_id });
            await conn.manager.insert(QuizAnswer, [
                new QuizAnswer({
                    updated_by_user_id: user_id,
                    quiz_question_id,
                    answer: "true",
                    correct: false,
                }),
                new QuizAnswer({
                    updated_by_user_id: user_id,
                    quiz_question_id,
                    answer: "false",
                    correct: false,
                }),
            ]);
        }
    });

    test("no answers on change", async () => {
        await putController(
            {
                session,
                dbConnection: conn,
                body: { question_type: "multiple correct - multiple choice" },
                params: { id: quiz_question_id },
            } as unknown as Request,
            res
        );

        const answers = await conn.manager.find(QuizAnswer, {
            where: { quiz_question_id },
        });

        expect(answers.length).toBe(0);
    });
});

describe("changing from multiple correct multiple choice to single correct", () => {
    beforeEach(async () => {
        await conn.manager.update(QuizQuestion, quiz_question_id, {
            question: "what is this?",
            question_type: "multiple correct - multiple choice",
        });
        await conn.manager.delete(QuizAnswer, { quiz_question_id });
        await conn.manager.insert(QuizAnswer, [
            new QuizAnswer({
                updated_by_user_id: user_id,
                quiz_question_id,
                answer: "a test",
                correct: true,
            }),
            new QuizAnswer({
                updated_by_user_id: user_id,
                quiz_question_id,
                answer: "a quiz",
                correct: true,
            }),
        ]);
    });

    test("sets all answers as incorrect", async () => {
        await putController(
            {
                session,
                dbConnection: conn,
                body: { question_type: "single correct - multiple choice" },
                params: { id: quiz_question_id },
            } as unknown as Request,
            res
        );

        const answers = await conn.manager.find(QuizAnswer, {
            where: { quiz_question_id },
        });

        expect(answers.length).toBe(2);
        expect(answers[0].correct).toBe(false);
        expect(answers[1].correct).toBe(false);
    });
});
