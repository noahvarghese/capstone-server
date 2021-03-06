import { getMockRes } from "@jest-mock/express";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import getController from "./get";
import { Request } from "express";
import Manual from "@models/manual/manual";
import ManualAssignment from "@models/manual/assignment";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let business_id: number, user_id: number, role_id: number, manual_id: number;
let conn: Connection;
let session: Omit<SessionData, "cookie">;

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();

    ({ business_id, user_id } = await setupAdmin(conn));
    role_id = (await conn.manager.findOneOrFail<Role>(Role)).id;

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

    await conn.manager.insert(
        ManualAssignment,
        new ManualAssignment({
            manual_id,
            updated_by_user_id: user_id,
            role_id,
        })
    );
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("published", () => {
    const published = [true, false];
    describe.each(published)("%p", (p) => {
        const permissions = ["ADMIN", "MANAGER", "USER"];

        beforeAll(async () => {
            conn.manager.update(Manual, manual_id, {
                published: p,
            });
        });

        describe.each(permissions)("permissions %p", (access) => {
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
                        params: { manual_id },
                        dbConnection: conn,
                    } as unknown as Request,
                    res
                );

                expect(res.status).toHaveBeenCalledWith(200);

                if (access === "USER" && p === false) {
                    expect(res.send).toHaveBeenCalledWith(undefined);
                } else {
                    expect(res.send).toHaveBeenCalledWith(
                        expect.objectContaining({ id: manual_id })
                    );
                }
            });
        });
    });
});
