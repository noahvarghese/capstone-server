import { getMockRes } from "@jest-mock/express";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import getController from "./get";

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
            business_id,
            updated_by_user_id: user_id,
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

describe("permissions", () => {
    const cases = ["ADMIN", "MANAGER", "USER"];
    describe.each(cases)("%p", (access) => {
        beforeEach(async () => {
            await conn.manager.update(Role, role_id, {
                access: access as AccessKey,
                prevent_edit: false,
            });
        });

        test("", async () => {
            await getController(
                {
                    session,
                    dbConnection: conn,
                    params: { id: role_id },
                } as unknown as Request,
                res
            );

            if (access === "USER") {
                expect(res.sendStatus).toHaveBeenCalledWith(403);
            } else {
                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.send).toHaveBeenCalledWith(
                    expect.objectContaining({ length: 1 })
                );
                expect(res.send).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({ id: manual_id }),
                    ])
                );
            }
        });
    });
});
