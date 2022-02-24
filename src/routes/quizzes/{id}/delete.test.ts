import { getMockRes } from "@jest-mock/express";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Quiz from "@models/quiz/quiz";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import deleteController from "./delete";

let business_id: number, user_id: number, manual_id: number, quiz_id: number;
let conn: Connection;
let session: Omit<SessionData, "cookie">;

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();

    ({ business_id, user_id } = await setupAdmin(conn));

    const { id: role_id } = await conn.manager.findOneOrFail(Role);

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
            updated_by_user_id: user_id,
            prevent_delete: false,
            prevent_edit: false,
            published: false,
            title: "TEST",
            business_id,
        })
    ));

    await conn.manager.insert(
        ManualAssignment,
        new ManualAssignment({
            updated_by_user_id: user_id,
            role_id,
            manual_id,
        })
    );

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
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("prevent edit", () => {
    const cases = [true, false];

    afterEach(async () => {
        if (!(await conn.manager.findOne(Quiz))) {
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
        }
    });

    describe.each(cases)("prevent delete: %p", (prevent_delete) => {
        beforeAll(async () => {
            await conn.manager.update(Quiz, quiz_id, { prevent_delete });
        });

        test("", async () => {
            await deleteController(
                {
                    session,
                    dbConnection: conn,
                    params: { id: quiz_id },
                } as unknown as Request,
                res
            );

            if (prevent_delete) {
                expect(res.sendStatus).toHaveBeenCalledWith(405);
            } else {
                expect(res.sendStatus).toHaveBeenCalledWith(200);
            }
        });
    });
});

describe("Permissions", () => {
    const cases = ["ADMIN", "MANAGER", "USER"];

    afterEach(async () => {
        await conn.manager.update(Role, () => "", {
            access: "ADMIN",
            prevent_edit: true,
        });
        if (!(await conn.manager.findOne(Quiz))) {
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
        }
    });

    describe.each(cases)("%p", (access) => {
        beforeAll(async () => {
            await conn.manager.update(Role, () => "", {
                access: access as AccessKey,
                prevent_edit: false,
            });
        });

        test("", async () => {
            await deleteController(
                {
                    session,
                    dbConnection: conn,
                    params: { id: quiz_id },
                } as unknown as Request,
                res
            );

            if (access !== "USER") {
                expect(res.sendStatus).toHaveBeenCalledWith(200);
            } else {
                expect(res.sendStatus).toHaveBeenCalledWith(403);
            }
        });
    });
});
