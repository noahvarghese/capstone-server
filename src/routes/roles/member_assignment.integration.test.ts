import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import { login } from "@test/api/actions/auth";
import {
    createRegularUser,
    createRole,
    getAdminUserId,
} from "@test/api/helpers/setup-actions";
import { EmptyPermissionAttributes } from "@models/permission";
import Request from "@test/api/helpers/request";
import UserRole from "@models/user/user_role";
import { memberAssignment, memberRemoval } from "@test/api/actions/roles";
import { Connection } from "typeorm";

let baseWorld: BaseWorld;
let userLogin: { id: number; email: string; password: string };
let roleId: number;
let connection: Connection;
const name = "TEST";

beforeAll(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    connection = baseWorld.getConnection();
    await Helpers.Api.setup(baseWorld, "@setup_invite_member");
    // Given I am logged in as an admin
    await login.call(login, baseWorld);
    // create user to assign to role
    userLogin = await createRegularUser.call(baseWorld);
    // create role to assign user to
    roleId = await createRole.call(baseWorld, name, "Admin", {
        ...EmptyPermissionAttributes(),
        updated_by_user_id: await getAdminUserId.call(baseWorld),
    });
});

afterAll(async () => {
    await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
});

describe("assign role to user(s)", () => {
    afterEach(async () => {
        await connection.manager.delete(UserRole, {
            user_id: userLogin.id,
            role_id: roleId,
        });
    });

    it("Should succeed", async () => {
        await memberAssignment.call(memberAssignment, baseWorld, {
            user_ids: [userLogin.id],
            role_id: roleId,
        });

        Request.succeeded.call(baseWorld, { status: /^20/, auth: false });

        await connection.manager.findOneOrFail(UserRole, {
            where: { role_id: roleId, user_id: userLogin.id },
        });
    });
});

describe("Can remove role from user(s)", () => {
    beforeEach(async () => {
        await memberAssignment.call(memberAssignment, baseWorld, {
            user_ids: [userLogin.id],
            role_id: roleId,
        });
    });
    it("Should succeed", async () => {
        await memberRemoval.call(memberRemoval, baseWorld, {
            user_ids: [userLogin.id],
            role_id: roleId,
        });

        // check result
        Request.succeeded.call(baseWorld, { status: /^20/, auth: false });

        expect(
            await connection.manager.count(UserRole, {
                where: { role_id: roleId, user_id: userLogin.id },
            })
        ).toBe(0);
    });
});
