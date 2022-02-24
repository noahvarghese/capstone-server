import { getMockRes } from "@jest-mock/express";
import postController from "./post";
import { Request } from "express";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { SessionData } from "express-session";
import { Connection } from "typeorm";
import Role, { AccessKey } from "@models/role";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Department from "@models/department";

let business_id: number, user_id: number, manual_id: number, role_id: number;
let conn: Connection;
let session: Omit<SessionData, "cookie">;

const { res, mockClear } = getMockRes();

beforeEach(mockClear);

beforeAll(async () => {
    await DBConnection.init();
    conn = await DBConnection.get();

    ({ business_id, user_id } = await setupAdmin(conn));

    ({ id: role_id } = await conn.manager.findOneOrFail(Role));

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
            updated_by_user_id: user_id,
            prevent_delete: false,
            prevent_edit: false,
            published: false,
            business_id,
            title: "TITLE",
        })
    ));
});

afterAll(async () => {
    await unitTeardown(conn);
    await DBConnection.close();
});

describe("manager of wrong role", () => {
    let newRoleID: number, deptId: number;

    beforeAll(async () => {
        await conn.manager.update(Role, role_id, {
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
        await conn.manager.delete(Department, deptId);
        await conn.manager.delete(Role, newRoleID);
    });

    test("fails", async () => {
        await postController(
            {
                session,
                dbConnection: conn,
                params: {
                    manual_id,
                    role_id: newRoleID,
                },
            } as unknown as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenCalledWith(403);
    });
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

        afterEach(async () => {
            await conn.manager.delete(ManualAssignment, () => "");
        });
        test("", async () => {
            await postController(
                {
                    session,
                    dbConnection: conn,
                    params: {
                        manual_id,
                        role_id,
                    },
                } as unknown as Request,
                res
            );

            if (access !== "USER") {
                expect(res.sendStatus).toHaveBeenCalledWith(201);

                const mans = await conn.manager.find(ManualAssignment);
                expect(mans.length).toBe(1);
            } else {
                expect(res.sendStatus).toHaveBeenCalledWith(403);
            }
        });
    });
});
