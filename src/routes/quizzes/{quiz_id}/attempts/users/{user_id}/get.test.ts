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
import getController from "./get";
import { Request } from "express";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

let business_id: number,
    user_id: number,
    role_id: number,
    manual_id: number,
    quiz_id: number,
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

    await conn.manager.insert(
        QuizAttempt,
        new QuizAttempt({ quiz_id, user_id: quizzedUserId })
    );
});

afterAll(async () => {
    await unitTeardown(conn);
    await conn.close();
});

describe("finished attempt", () => {
    test.todo("provides score");
    test.todo("does not provide score");
});

describe("users can only view their own attempts", () => {
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

    describe("view own attempt", () => {
        test("success", async () => {
            await getController(
                {
                    session: {
                        ...session,
                        user_id: quizzedUserId,
                    },
                    dbConnection: conn,
                    params: { quiz_id, user_id: quizzedUserId },
                } as unknown as Request,
                res
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        quiz_id,
                        user_id: quizzedUserId,
                    }),
                ])
            );
        });
    });
    test("view other's attempt", async () => {
        await getController(
            {
                session,
                dbConnection: conn,
                params: { quiz_id, user_id: quizzedUserId },
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
                    params: { quiz_id, user_id: quizzedUserId },
                } as unknown as Request,
                res
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        quiz_id,
                        user_id: quizzedUserId,
                    }),
                ])
            );
        });
    });
});
