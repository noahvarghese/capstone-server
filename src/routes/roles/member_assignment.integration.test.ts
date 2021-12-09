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

let baseWorld: BaseWorld;
const name = "TEST";
jest.setTimeout(500000);

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Helpers.Api.setup(baseWorld, "@setup_invite_member");
});

afterEach(async () => {
    await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
});

beforeEach(async () => {
    // Given I am logged in as an admin
    await login.call(login, baseWorld);
    // create user to assign to role
    baseWorld.setCustomProp("user", await createRegularUser.call(baseWorld));
    // create role to assign user to
    baseWorld.setCustomProp(
        "role",
        await createRole.call(baseWorld, name, "Admin", {
            ...EmptyPermissionAttributes(),
            updated_by_user_id: await getAdminUserId.call(baseWorld),
        })
    );
});

describe("Global admin authorized", () => {
    test("Can assign role to user(s)", async () => {
        const connection = baseWorld.getConnection();
        const { id } = baseWorld.getCustomProp<{ id: number }>("user");
        const role_id = baseWorld.getCustomProp("role");

        await memberAssignment.call(memberAssignment, baseWorld, {
            user_ids: [id],
            role_id,
        });

        Request.succeeded.call(baseWorld, { status: /^20/, auth: false });
        expect(
            await connection.manager.findOne(UserRole, {
                where: { role_id, user_id: id },
            })
        ).not.toBe(undefined);
    });
    test("Can remove role from user(s)", async () => {
        const connection = baseWorld.getConnection();
        // assign role to user
        const { id } = baseWorld.getCustomProp<{ id: number }>("user");
        const role_id = baseWorld.getCustomProp("role");

        await memberAssignment.call(memberAssignment, baseWorld, {
            user_ids: [id],
            role_id,
        });

        // pre action check
        expect(
            await connection.manager.findOne(UserRole, {
                where: { role_id, user_id: id },
            })
        ).not.toBe(undefined);

        // test action
        await memberRemoval.call(memberRemoval, baseWorld, {
            user_ids: [id],
            role_id,
        });

        // check result
        Request.succeeded.call(baseWorld, { status: /^20/, auth: false });
        expect(
            await connection.manager.findOne(UserRole, {
                where: { role_id, user_id: id },
            })
        ).toBe(undefined);
    });
});
