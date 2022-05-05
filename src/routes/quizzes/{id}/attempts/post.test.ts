import { getMockRes } from "@jest-mock/express";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import QuizAttempt from "@models/quiz/attempt";
import Quiz from "@models/quiz/quiz";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import postController from "./post";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    quiz_id: number;
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
});

afterAll(async () => {
    await unitTeardown(conn);
    await conn.close();
});

describe("user", () => {
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

    describe("max attempts", () => {
        beforeAll(async () => {
            await conn.manager.update(Quiz, quiz_id, { max_attempts: 0 });
        });
        afterAll(async () => {
            await conn.manager.update(Quiz, quiz_id, { max_attempts: 1 });
        });

        test("stops user from going over the max attempts", async () => {
            await postController(
                {
                    dbConnection: conn,
                    session,
                    params: { id: quiz_id },
                } as unknown as Request,
                res
            );
            expect(res.sendStatus).toHaveBeenCalledWith(405);
        });
    });
    describe("success", () => {
        afterAll(async () => {
            await conn.manager.delete(QuizAttempt, { quiz_id, user_id });
        });

        test("user can create a quiz attempt for themselves", async () => {
            await postController(
                {
                    dbConnection: conn,
                    session,
                    params: { id: quiz_id },
                } as unknown as Request,
                res
            );

            const qa = await conn.manager.find(QuizAttempt);

            expect(qa.length).toBe(1);

            expect(qa[0].user_id).toBe(user_id);
            expect(qa[0].quiz_id).toBe(quiz_id);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe("manual assignment", () => {
        beforeAll(async () => {
            await conn.manager.delete(ManualAssignment, { manual_id, role_id });
        });

        afterAll(async () => {
            await conn.manager.insert(
                ManualAssignment,
                new ManualAssignment({
                    manual_id,
                    role_id,
                    updated_by_user_id: user_id,
                })
            );
        });

        test("user cannot attempt quiz that is not assigned", async () => {
            await postController(
                {
                    dbConnection: conn,
                    session,
                    params: { id: quiz_id },
                } as unknown as Request,
                res
            );
            expect(res.sendStatus).toHaveBeenCalledWith(405);
        });
    });

    describe("quiz published", () => {
        beforeAll(async () => {
            await conn.manager.update(Quiz, quiz_id, { published: false });
        });

        afterAll(async () => {
            await conn.manager.update(Quiz, quiz_id, { published: true });
        });

        test("user cannot attempt quiz that is not published", async () => {
            await postController(
                {
                    dbConnection: conn,
                    session,
                    params: { id: quiz_id },
                } as unknown as Request,
                res
            );
            expect(res.sendStatus).toHaveBeenCalledWith(405);
        });
    });

    describe("manual published", () => {
        beforeAll(async () => {
            await conn.manager.update(Manual, manual_id, { published: false });
        });

        afterAll(async () => {
            await conn.manager.update(Manual, manual_id, { published: true });
        });

        test("user cannot attempt quiz whose manual is not published", async () => {
            await postController(
                {
                    dbConnection: conn,
                    session,
                    params: { id: quiz_id },
                } as unknown as Request,
                res
            );
            expect(res.sendStatus).toHaveBeenCalledWith(405);
        });
    });
});

describe("permissions", () => {
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

        test("only users can create an attempt", async () => {
            await postController(
                {
                    dbConnection: conn,
                    session,
                    params: { id: quiz_id },
                } as unknown as Request,
                res
            );
            expect(res.sendStatus).toHaveBeenCalledWith(403);
        });
    });
});
