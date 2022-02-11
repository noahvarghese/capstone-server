import { getMockRes } from "@jest-mock/express";
import Role, { AccessKey } from "@models/role";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import deleteController from "./delete";
import { Request } from "express";
import { Connection } from "typeorm";
import User from "@models/user/user";
import Membership from "@models/membership";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let business_id: number, user_id: number, testUserID: number;

let conn: Connection;
beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();
    // Create admin user
    ({ business_id, user_id } = await setupAdmin(conn));
    ({
        identifiers: [{ id: testUserID }],
    } = await conn.manager.insert(
        User,
        new User({ first_name: "TEST", last_name: "TEST", email: "TEST" })
    ));
    await conn.manager.insert(
        Membership,
        new Membership({
            user_id: testUserID,
            business_id,
            updated_by_user_id: user_id,
        })
    );
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

test("delete prevention", async () => {
    await deleteController(
        {
            session: {
                user_id,
                business_ids: [business_id],
                current_business_id: business_id,
            },
            params: { user_id },
            dbConnection: conn,
        } as unknown as Request,
        res
    );

    expect(res.sendStatus).toHaveBeenCalledWith(405);
});

describe("permissions", () => {
    const cases = [
        { access: "ADMIN", success: true },
        { access: "MANAGER", success: true },
        { access: "USER", success: false },
    ];

    test.each(cases)("%p", async ({ access }) => {
        await conn.manager.update(Role, () => "", {
            access: access as AccessKey,
            prevent_edit: false,
        });
        await deleteController(
            {
                session: {
                    user_id,
                    business_ids: [business_id],
                    current_business_id: business_id,
                },
                params: { user_id: testUserID },
                dbConnection: conn,
            } as unknown as Request,
            res
        );

        expect(res.sendStatus).toHaveBeenCalledWith(
            access === "ADMIN" ? 200 : 403
        );
    });
});
