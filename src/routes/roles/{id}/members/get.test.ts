import { getMockRes } from "@jest-mock/express";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { Connection } from "typeorm";
import getController from "./get";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let business_id: number, user_id: number;

let conn: Connection;

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();
    ({ user_id, business_id } = await setupAdmin(conn));
});

afterAll(async () => {
    await unitTeardown(conn);
    await conn.close();
});

describe("permissions", () => {
    const cases = ["ADMIN", "MANAGER", "USER"];

    test.each(cases)("%p", async (access) => {
        await conn.manager.update(Role, () => "", {
            access: access as AccessKey,
            prevent_edit: false,
        });
        await getController(
            {
                session: {
                    user_id,
                    current_business_id: business_id,
                    business_ids: [business_id],
                },
                dbConnection: conn,
                params: { id: (await conn.manager.findOneOrFail(Role)).id },
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
        }
    });
});
