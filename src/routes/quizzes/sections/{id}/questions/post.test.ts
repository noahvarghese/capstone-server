import { getMockRes } from "@jest-mock/express";
import Manual from "@models/manual/manual";
import QuizQuestion from "@models/quiz/question/question";
import Quiz from "@models/quiz/quiz";
import QuizSection from "@models/quiz/section";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import postController from "./post";

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    quiz_id: number,
    quiz_section_id: number;
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
        await postController(
            {
                session,
                dbConnection: conn,
                body: {
                    question: "TEST",
                    question_type: "multiple correct - multiple choice",
                },
                params: { id: quiz_section_id },
            } as unknown as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenCalledWith(405);
    });
});

describe("Permissions", () => {
    const cases = ["ADMIN", "MANAGER", "USER"];

    afterEach(async () => {
        await conn.manager.delete(QuizQuestion, { quiz_section_id });
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

        await postController(
            {
                session,
                dbConnection: conn,
                body: {
                    question: "WHO AM I",
                    question_type: "multiple correct - multiple choice",
                },
                params: { id: quiz_section_id },
            } as unknown as Request,
            res
        );

        const qq = await conn.manager.find(QuizQuestion);
        if (access !== "USER") {
            expect(res.sendStatus).toHaveBeenCalledWith(201);

            expect(qq.length).toBe(1);
        } else {
            expect(res.sendStatus).toHaveBeenCalledWith(403);

            expect(qq.length).toBe(0);
        }
    });
});

test("invalid question", async () => {
    await postController(
        {
            session,
            dbConnection: conn,
            body: {
                question_type: "multiple correct - multiple choice",
            },
            params: { id: quiz_section_id },
        } as unknown as Request,
        res
    );

    expect(res.status).toHaveBeenCalledWith(400);
});
