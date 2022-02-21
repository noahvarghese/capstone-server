import { getMockRes } from "@jest-mock/express";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import QuizAttempt from "@models/quiz/attempt";
import Quiz from "@models/quiz/quiz";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import sleep from "@util/sleep";
import { Request } from "express";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import putController from "./put";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    quiz_id: number,
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
        ({
            identifiers: [{ id: quiz_attempt_id }],
        } = await conn.manager.insert(
            QuizAttempt,
            new QuizAttempt({ quiz_id, user_id })
        ));
    });

    afterAll(async () => {
        await conn.manager.update(Role, role_id, {
            access: "ADMIN",
            prevent_edit: true,
        });
        await conn.manager.delete(QuizAttempt, quiz_attempt_id);
    });

    test("success", async () => {
        await putController(
            {
                session,
                dbConnection: conn,
                params: { id: quiz_attempt_id },
            } as unknown as Request,
            res
        );

        expect(res.sendStatus).toHaveBeenCalledWith(200);
    });

    describe("already updated", () => {
        beforeAll(async () => {
            await sleep(2000);
            await conn.manager.update(QuizAttempt, quiz_attempt_id, {
                updated_on: new Date(),
            });
        });

        test("fail", async () => {
            await putController(
                {
                    session,
                    dbConnection: conn,
                    params: { id: quiz_attempt_id },
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
            await putController(
                {
                    dbConnection: conn,
                    session,
                    params: { id: quiz_attempt_id },
                } as unknown as Request,
                res
            );
            expect(res.sendStatus).toHaveBeenCalledWith(403);
        });
    });
});

describe("keep test coverage up LOL", () => {
    beforeAll(async () => {
        await conn.manager.update(Role, role_id, {
            access: "USER",
            prevent_edit: false,
        });
        await conn.manager.delete(QuizAttempt, () => "");
    });

    afterAll(async () => {
        await conn.manager.update(Role, role_id, {
            access: "ADMIN",
            prevent_edit: true,
        });
    });

    test("non numerical id", async () => {
        await putController(
            {
                session,
                dbConnection: conn,
                params: { id: "ASDF" },
            } as unknown as Request,
            res
        );

        expect(res.sendStatus).toHaveBeenCalledWith(400);
    });

    test("no quiz attempts exist with id", async () => {
        await putController(
            {
                session,
                dbConnection: conn,
                params: { id: 1 },
            } as unknown as Request,
            res
        );

        expect(res.sendStatus).toHaveBeenCalledWith(400);
    });
});
