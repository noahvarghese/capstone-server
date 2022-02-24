import { getMockRes } from "@jest-mock/express";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import { Request } from "express";
import getController from "./get";

const { mockClear, res } = getMockRes();

beforeEach(mockClear);

let business_id: number, user_id: number, role_id: number;
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

    role_id = (await conn.manager.findOneOrFail(Role)).id;
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("permissions", () => {
    describe("user does not have access", () => {
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
        test("403", async () => {
            await getController(
                { session, dbConnection: conn } as Request,
                res
            );
            expect(res.sendStatus).toHaveBeenCalledWith(403);
        });
    });

    describe("admin and manager have access", () => {
        const cases: AccessKey[] = ["ADMIN", "MANAGER"];
        describe.each(cases)("%p", (access) => {
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
                    } as Request,
                    res
                );

                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.send).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({ managers: 1, name: "Admin" }),
                    ])
                );
            });
        });
    });
});
