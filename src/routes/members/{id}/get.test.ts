import { getMockRes } from "@jest-mock/express";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import getController from "./get";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let business_id: number, user_id: number;

beforeAll(async () => {
    await DBConnection.init();
    ({ business_id, user_id } = await setupAdmin(await DBConnection.get()));
});

afterAll(async () => {
    const conn = await DBConnection.get();
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("permissions", () => {
    const cases = [
        { access: "ADMIN", success: true },
        { access: "MANAGER", success: true },
        { access: "USER", success: false },
    ];
    test.each(cases)("%p", async ({ access }) => {
        const conn = await DBConnection.get();
        await conn.manager.update(Role, () => "", {
            access: access as AccessKey,
            prevent_edit: false,
        });
        await getController(
            {
                session: {
                    user_id,
                    business_ids: [business_id],
                    current_business_id: business_id,
                },
                params: { id: user_id },
                dbConnection: conn,
            } as unknown as Request,
            res
        );

        if (access === "USER") {
            expect(res.sendStatus).toHaveBeenLastCalledWith(403);
        } else {
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ id: user_id })
            );
        }
    });
});
