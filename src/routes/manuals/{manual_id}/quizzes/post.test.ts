import { getMockRes } from "@jest-mock/express";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import { Request } from "express";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import Role, { AccessKey } from "@models/role";
import Manual from "@models/manual/manual";
import postController from "./post";
import Quiz from "@models/quiz/quiz";

let business_id: number, user_id: number, role_id: number, manual_id: number;
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
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("permissions", () => {
    const permissions: AccessKey[] = ["ADMIN", "MANAGER", "USER"];

    describe.each(permissions)("%p", (access) => {
        beforeAll(async () => {
            await conn.manager.update(Role, role_id, {
                access: access as AccessKey,
                prevent_edit: false,
            });
        });

        afterAll(async () => {
            await conn.manager.delete(Quiz, { manual_id });
            await conn.manager.update(Role, role_id, {
                access: "ADMIN",
                prevent_edit: true,
            });
        });

        test("", async () => {
            await postController(
                {
                    session,
                    dbConnection: conn,
                    params: { manual_id },
                    body: {
                        title: "TEST",
                        max_attempts: 4,
                        prevent_delete: false,
                        prevent_edit: false,
                    },
                } as unknown as Request,
                res
            );

            expect(res.sendStatus).toHaveBeenCalledWith(
                access === "USER" ? 403 : 201
            );
        });
    });
});
