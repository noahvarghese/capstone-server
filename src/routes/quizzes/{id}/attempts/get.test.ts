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
import getController from "./get";

const { res, mockClear } = getMockRes();

let user_id: number,
    business_id: number,
    role_id: number,
    manual_id: number,
    quiz_id: number;

let conn: Connection;

let session: Omit<SessionData, "cookie">;

beforeEach(mockClear);

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

    await conn.manager.insert(
        QuizAttempt,
        new QuizAttempt({ quiz_id, user_id })
    );
});

afterAll(async () => {
    await unitTeardown(conn);
    await conn.close();
});

describe("permissions", () => {
    const p: AccessKey[] = ["ADMIN", "MANAGER", "USER"];
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

        test("", async () => {
            await getController(
                {
                    session,
                    dbConnection: conn,
                    params: { id: quiz_id },
                } as unknown as Request,
                res
            );

            if (access === "USER") {
                expect(res.sendStatus).toHaveBeenCalledWith(403);
            } else {
                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.send).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({ quiz_id, user_id }),
                    ])
                );
                expect(res.send).toHaveBeenCalledWith(
                    expect.objectContaining({ length: 1 })
                );
            }
        });
    });
});
