import { getMockRes } from "@jest-mock/express";
import Membership from "@models/membership";
import Role, { AccessKey } from "@models/role";
import User from "@models/user/user";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Request } from "express";
import { Connection } from "typeorm";
import getController from "./get";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let business_id: number, user_id: number, conn: Connection;

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();
    ({ business_id, user_id } = await setupAdmin(await DBConnection.get()));
});

afterAll(async () => {
    const conn = await DBConnection.get();
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("users can only edit themselves", () => {
    beforeAll(async () => {
        await conn.manager.update(Role, () => "", {
            access: "USER",
            prevent_edit: false,
        });
    });

    afterAll(async () => {
        await conn.manager.update(Role, () => "", {
            access: "ADMIN",
            prevent_edit: true,
        });
    });

    test("", async () => {
        await getController(
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

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({ id: user_id })
        );
    });
});

describe("permissions", () => {
    const cases = [
        { access: "ADMIN", success: true },
        { access: "MANAGER", success: true },
        { access: "USER", success: false },
    ];
    let newUserId: number;
    beforeAll(async () => {
        ({
            identifiers: [{ id: newUserId }],
        } = await conn.manager.insert(
            User,
            new User({
                first_name: "Test",
                last_name: "test",
                email: "test@test.com",
                password: "test",
            })
        ));

        await conn.manager.insert(
            Membership,
            new Membership({
                updated_by_user_id: user_id,
                user_id: newUserId,
                business_id,
            })
        );
    });

    afterAll(async () => {
        await conn.manager.update(Role, () => "", {
            access: "ADMIN",
            prevent_edit: true,
        });
        await conn.manager.delete(Membership, { user_id: newUserId });
        await conn.manager.delete(User, newUserId);
    });

    test.each(cases)("%p", async ({ access }) => {
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
                params: { user_id: newUserId },
                dbConnection: conn,
            } as unknown as Request,
            res
        );

        if (access === "USER") {
            expect(res.sendStatus).toHaveBeenLastCalledWith(403);
        } else {
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ id: newUserId })
            );
        }
    });
});
