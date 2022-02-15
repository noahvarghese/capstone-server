import { getMockRes } from "@jest-mock/express";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Connection } from "typeorm";
import { Request } from "express";
import deleteController from "./delete";
import User from "@models/user/user";
import Role, { AccessKey } from "@models/role";
import Department from "@models/department";
import Membership from "@models/membership";
import UserRole from "@models/user/user_role";
import { SessionData } from "express-session";

let business_id: number, user_id: number, adminRoleId: number;
let conn: Connection;
let session: Omit<SessionData, "cookie">;

let newUserId: number, newRoleId: number;

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();

    ({ business_id, user_id } = await setupAdmin(conn));

    ({ id: adminRoleId } = await conn.manager.findOneOrFail(Role));

    session = {
        user_id,
        business_ids: [business_id],
        current_business_id: business_id,
    };

    const role = new Role({
        updated_by_user_id: user_id,
        name: "TEST",
        department_id: (await conn.manager.findOneOrFail(Department)).id,
    });

    [
        {
            identifiers: [{ id: newUserId }],
        },
        {
            identifiers: [{ id: newRoleId }],
        },
    ] = await Promise.all([
        conn.manager.insert(
            User,
            new User({
                first_name: "TEST",
                last_name: "TEST",
                email: "TEST",
                password: "TEST",
            })
        ),
        conn.manager.insert(Role, role),
    ]);

    await conn.manager.insert(
        Membership,
        new Membership({
            user_id: newUserId,
            business_id,
            updated_by_user_id: user_id,
        })
    );

    await conn.manager.insert(
        UserRole,
        new UserRole({
            user_id: newUserId,
            role_id: newRoleId,
            updated_by_user_id: user_id,
        })
    );
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("manager of wrong role", () => {
    let newRoleID: number, deptId: number;

    beforeAll(async () => {
        await conn.manager.update(Role, adminRoleId, {
            access: "MANAGER",
            prevent_edit: false,
        });

        ({
            identifiers: [{ id: deptId }],
        } = await conn.manager.insert(
            Department,
            new Department({
                name: "TEST!!!",
                business_id,
                prevent_delete: false,
                prevent_edit: false,
                updated_by_user_id: user_id,
            })
        ));

        ({
            identifiers: [{ id: newRoleID }],
        } = await conn.manager.insert(
            Role,
            new Role({
                department_id: deptId,
                access: "USER",
                name: "TEST!@#!@#!@#",
                prevent_delete: false,
                prevent_edit: false,
                updated_by_user_id: user_id,
            })
        ));
    });

    afterAll(async () => {
        await conn.manager.update(Role, adminRoleId, {
            access: "ADMIN",
            prevent_edit: true,
        });

        await conn.manager.delete(Department, deptId);
        await conn.manager.delete(Role, newRoleID);
    });

    test("fails", async () => {
        await deleteController(
            {
                session,
                dbConnection: conn,
                params: {
                    user_id: newUserId,
                    role_id: newRoleID,
                },
            } as unknown as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenCalledWith(403);
    });
});

describe("permissions", () => {
    const cases: AccessKey[] = ["MANAGER", "ADMIN", "USER"];

    afterAll(async () => {
        await conn.manager.update(Role, adminRoleId, {
            access: "ADMIN",
            prevent_edit: true,
        });
    });

    describe.each(cases)("%p", (access) => {
        beforeEach(async () => {
            await conn.manager.update(
                Role,
                { id: adminRoleId },
                {
                    access,
                    prevent_edit: false,
                }
            );
        });

        afterEach(async () => {
            if (
                !(await conn.manager.findOne(UserRole, {
                    where: { user_id: newUserId, role_id: newRoleId },
                }))
            ) {
                await conn.manager.insert(
                    UserRole,
                    new UserRole({
                        user_id: newUserId,
                        role_id: newRoleId,
                        updated_by_user_id: user_id,
                    })
                );
            }
        });

        test("", async () => {
            await deleteController(
                {
                    session,
                    dbConnection: conn,
                    params: { user_id: newUserId, role_id: newRoleId },
                } as unknown as Request,
                res
            );

            expect(res.sendStatus).toHaveBeenLastCalledWith(
                access !== "USER" ? 200 : 403
            );
        });
    });
});
