import { getMockRes } from "@jest-mock/express";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";
import { Connection, Not } from "typeorm";
import { Request } from "express";
import postController from "./post";
import User from "@models/user/user";
import Role, { AccessKey } from "@models/role";
import Department from "@models/department";
import Membership from "@models/membership";
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
test("invalid session", async () => {
    await postController(
        {
            session: {
                user_id: NaN,
                current_business_id: business_id,
                business_ids: [business_id],
            },
            params: {},
        } as unknown as Request,
        res
    );
    expect(res.sendStatus).toHaveBeenCalledWith(401);
});

test("invalid connection", async () => {
    await postController(
        {
            session: {
                user_id,
                current_business_id: business_id,
                business_ids: [business_id],
            },
            params: {},
        } as unknown as Request,
        res
    );
    expect(res.sendStatus).toHaveBeenCalledWith(500);
});

describe("invalid parameters", () => {
    const cases = [
        { user_id: NaN, role_id: NaN },
        { user_id: 10000, role_id: 100000 },
    ];
    test.each(cases)("%p", async () => {
        await postController(
            {
                session: {
                    user_id,
                    current_business_id: business_id,
                    business_ids: [business_id],
                },
                dbConnection: conn,
                params: { user_id: NaN, role_id: "YOLO" },
            } as unknown as Request,
            res
        );
        expect(res.sendStatus).toHaveBeenCalledWith(400);
    });
});

describe("permissions", () => {
    const cases = ["MANAGER", "ADMIN", "USER"];
    let newUserId: number, newRoleId: number;

    beforeAll(async () => {
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
    });

    afterAll(async () => {
        await conn.manager.delete(UserRole, { user_id: newUserId });
        await Promise.all([
            conn.manager.delete(Membership, { user_id: newUserId }),
            conn.manager.delete(Role, { id: newRoleId }),
        ]);
        await conn.manager.delete(User, newUserId);
    });

    test.each(cases)("%p", async (access) => {
        await conn.manager.update(
            Role,
            { id: Not(newRoleId) },
            {
                access: access as AccessKey,
                prevent_edit: false,
            }
        );
        await postController(
            {
                session: {
                    user_id,
                    current_business_id: business_id,
                    business_ids: [business_id],
                },
                dbConnection: conn,
                params: { user_id: newUserId, role_id: newRoleId },
            } as unknown as Request,
            res
        );

        expect(res.sendStatus).toHaveBeenLastCalledWith(
            access === "ADMIN" ? 201 : 403
        );
    });
});
