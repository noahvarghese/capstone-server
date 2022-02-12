import { getMockRes } from "@jest-mock/express";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Connection } from "typeorm";
import getController from "./get";
import { Request } from "express";
import Role, { AccessKey } from "@models/role";
import Department from "@models/department";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

let business_id: number, user_id: number;
let conn: Connection;

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();
    ({ business_id, user_id } = await setupAdmin(conn));
});

afterAll(async () => {
    const conn = await DBConnection.get();
    await unitTeardown(conn);
    await DBConnection.close();
});

test("bad connection", async () => {
    await getController(
        {
            session: {
                user_id,
                business_ids: [business_id],
                current_business_id: business_id,
            },
            params: {
                user_id: 1,
            },
        } as unknown as Request,
        res
    );
    expect(res.sendStatus).toHaveBeenLastCalledWith(500);
});

describe("invalid session", () => {
    const cases = [
        { user_id: undefined, current_business_id: 1, business_ids: [1] },
        { user_id: 1, current_business_id: undefined, business_ids: [1] },
    ];
    test.each(cases)("%p", async (session) => {
        await getController(
            {
                session,
                params: {
                    user_id: 1,
                },
            } as unknown as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenLastCalledWith(401);
    });
});

describe("invalid id", () => {
    const cases = [{ id: "YOLO" }, { id: 10000 }];
    test.each(cases)("%p", async ({ id }) => {
        await getController(
            {
                session: {
                    user_id,
                    business_ids: [business_id],
                    current_business_id: business_id,
                },
                params: {
                    user_id: id,
                },
                dbConnection: conn,
            } as unknown as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenLastCalledWith(400);
    });
});

describe("requires second user with no permissions", () => {
    let newUserId: number, role_id: number;

    beforeAll(async () => {
        const { id } = await conn.manager.findOneOrFail(Department);
        ({
            identifiers: [{ id: role_id }],
        } = await conn.manager.insert(
            Role,
            new Role({
                department_id: id,
                updated_by_user_id: user_id,
                access: "USER",
                name: "TEST",
            })
        ));

        ({
            identifiers: [{ id: newUserId }],
        } = await conn.manager.insert(
            User,
            new User({
                first_name: "TESt",
                last_name: "TEST",
                email: "TEST",
                password: "TEST",
            })
        ));
        await conn.manager.insert(
            UserRole,
            new UserRole({
                user_id: newUserId,
                role_id,
                updated_by_user_id: user_id,
            })
        );
    });

    afterAll(async () => {
        await conn.manager.delete(UserRole, { user_id: newUserId });
        await conn.manager.delete(User, newUserId);
        await conn.manager.delete(Role, role_id);
    });
    test("self access with underprivleled user", async () => {
        await getController(
            {
                session: {
                    user_id: newUserId,
                    business_ids: [business_id],
                    current_business_id: business_id,
                },
                params: {
                    user_id: newUserId,
                },
                dbConnection: conn,
            } as unknown as Request,
            res
        );
        expect(res.status).toHaveBeenLastCalledWith(200);
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
            await getController(
                {
                    session: {
                        user_id,
                        business_ids: [business_id],
                        current_business_id: business_id,
                    },
                    params: {
                        user_id: newUserId,
                    },
                    dbConnection: conn,
                } as unknown as Request,
                res
            );

            if (access === "USER") {
                expect(res.sendStatus).toHaveBeenLastCalledWith(403);
            } else {
                expect(res.status).toHaveBeenCalledWith(200);
            }
        });
    });
});
