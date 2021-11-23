import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import { login } from "@test/api/actions/auth";
import { getAdminUserId, loginUser } from "@test/api/helpers/setup-actions";
import { readManyMembers, readOneMember } from "@test/api/actions/members";
import { registerBusiness } from "@test/api/attributes/business";
import Request from "@test/api/helpers/request";
import { inviteMember } from "@test/api/attributes/member";
import { ReadMembers } from ".";

let baseWorld: BaseWorld;

beforeAll(async () => {
    await DBConnection.init();
    await Helpers.AppServer.setup(false);
});
afterAll(async () => {
    await Helpers.AppServer.teardown();
    await DBConnection.close();
});

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Helpers.Api.setup(baseWorld, "@setup_invite_member");
});

afterEach(async () => {
    await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
});

describe("Global admin authorized", () => {
    beforeEach(async () => {
        // Given I am logged in as an admin
        await login.call(login, baseWorld);
    });

    test.todo(
        "Global admin can create membership"

        // , async () => {
        // // When I create a membership

        // await actions.createMembership.call(baseWorld);

        // // Then a new membership exists
        // Request.success.call(baseWorld);
        // }
    );

    test.todo("Global admin can delete membership");
    // Scenario: Global Admin Can Delete Membership
    //     Given I am logged in as an admin
    //     When I delete a membership
    //     Then a membership is deleted

    test("Global admin can read a list of members", async () => {
        const user_id = await getAdminUserId.call(baseWorld);
        await readManyMembers.call(readManyMembers, baseWorld);
        const response = baseWorld.getCustomProp<ReadMembers[]>("responseData");

        Request.succeeded.call(baseWorld);
        expect(response.length).toBe(1);

        const { user, roles } = response[0];

        expect(roles.length).toBe(1);

        const role = roles[0];

        expect(user.birthday).toBe(null);
        expect(user.first_name).toBe(registerBusiness().first_name);
        expect(user.last_name).toBe(registerBusiness().last_name);
        expect(user.email).toBe(registerBusiness().email);
        expect(user.phone).toBe(registerBusiness().phone);
        expect(user.id).toBe(user_id);
        expect(role.default).toBe(true);
        expect(role.name).toBe("General");
        expect(role.department.name).toBe("Admin");
    });
    test("Global admin can read individual members", async () => {
        const user_id = await getAdminUserId.call(baseWorld);
        await readOneMember.call(readOneMember, baseWorld, user_id);
        const { user, roles } =
            baseWorld.getCustomProp<ReadMembers>("responseData");

        Request.succeeded.call(baseWorld);
        expect(roles.length).toBe(1);

        const role = roles[0];

        expect(user.birthday).toBe(null);
        expect(user.first_name).toBe(registerBusiness().first_name);
        expect(user.last_name).toBe(registerBusiness().last_name);
        expect(user.email).toBe(registerBusiness().email);
        expect(user.phone).toBe(registerBusiness().phone);
        expect(user.id).toBe(user_id);
        expect(role.default).toBe(true);
        expect(role.name).toBe("General");
        expect(role.department.name).toBe("Admin");
    });
});

describe("User who lacks CRUD rights", () => {
    beforeEach(async () => {
        // Given I am logged in as a user
        baseWorld.setCustomProp("user", await loginUser.call(baseWorld));
    });
    test.todo(
        "User who lacks CRUD membership rights cannot create memberships"
    );
    // Given I am logged in as a user
    // When I create a membership
    // Then I get an error
    test.todo("User who lacks CRUD rights cannot delete membership");
    // Scenario: User who lacks CRUD membership rights cannot delete memberships
    //     Given I am logged in as a user
    //     When I delete a membership
    //     Then I get an error
    test("User who lacks CRUD rights cannot read a list of members", async () => {
        await readManyMembers.call(readManyMembers, baseWorld);

        Request.failed.call(baseWorld, {
            include404: false,
            message: "Insufficient permissions",
            status: /^403$/,
        });
    });
    test("User who lacks CRUD rights can read their user", async () => {
        const user = baseWorld.getCustomProp<{
            id: number;
            email: string;
            password: string;
        }>("user");
        await readOneMember.call(readOneMember, baseWorld, user.id);
        Request.succeeded.call(baseWorld);
        const response = baseWorld.getCustomProp<ReadMembers>("responseData");

        Request.succeeded.call(baseWorld);
        // This is because the loginUser does not assign a role by default
        expect(response.roles.length).toBe(0);

        expect(response.user.birthday).toBe(null);
        expect(response.user.first_name).toBe(inviteMember().first_name);
        expect(response.user.last_name).toBe(inviteMember().last_name);
        expect(response.user.email).toBe(user.email);
        expect(response.user.phone).toBe(inviteMember().phone);
        expect(response.user.id).toBe(user.id);
    });
    test("User who lacks CRUD rights cannot read individual users", async () => {
        const adminId = await getAdminUserId.call(baseWorld);
        await readOneMember.call(readOneMember, baseWorld, adminId);

        Request.failed.call(baseWorld, {
            include404: false,
            message: "Insufficient permissions",
            status: /^403$/,
        });
    });
});
