import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import actions from "@test/api/actions";
import MembershipRequest from "@models/membership_request";
import User from "@models/user/user";
import attributes from "@test/api/attributes";
import { InviteUserProps } from "./invite";
import Membership from "@models/membership";
import Request from "@test/api/helpers/request";
import Event from "@models/event";
import { loginUser } from "@test/api/helpers/setup-actions";

let baseWorld: BaseWorld;
jest.setTimeout(5000000);

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
});

afterEach(async () => {
    await Helpers.Api.teardown.call(baseWorld, "@cleanup_user_role");
    baseWorld.resetProps();
});

describe("Sending invites to join business", () => {
    async function receiveInvite(this: BaseWorld) {
        const connection = this.getConnection();
        const { email } = attributes.inviteUser() as InviteUserProps;

        const user = await connection.manager.find(User, {
            where: {
                email,
            },
        });

        if (user.length !== 1) {
            throw new Error(
                `${
                    user.length === 0 ? "No" : "Multiple"
                } users found with email: ${email}`
            );
        }

        const event = await connection.manager.find(Event, {
            where: { user_id: user[0].id },
        });

        if (event.length !== 1) {
            throw new Error(
                `${
                    event.length === 0 ? "No" : "Multiple"
                } events found for user: ${email}`
            );
        }

        expect(event[0].status).toEqual("PASS");

        const membershipRequests = await connection.manager.find(
            MembershipRequest,
            { where: { user_id: user[0].id } }
        );

        expect(membershipRequests.length).toEqual(1);
    }

    beforeEach(async () => {
        await Helpers.Api.setup.call(baseWorld, "@setup_invite_user");
    });

    test("New user invited to business", async () => {
        // Given I am logged in as an admin
        await actions.login.call(baseWorld);
        // When a new user is added to the business
        await actions.inviteUser.call(baseWorld, "new");
        // Then the user should get an invite
        await receiveInvite.call(baseWorld);
    });

    test("Existing user invited to business", async () => {
        // Given I am logged in as an admin
        await actions.login.call(baseWorld);
        // When an existing user is added to the business
        await actions.inviteUser.call(baseWorld, "existing");
        // Then the user should get an invite
        await receiveInvite.call(baseWorld);
    });

    test("Non admin cannot invite user", async () => {
        // Given I am logged in as a user
        await loginUser.call(baseWorld);
        // When a new user is added to the business
        await actions.inviteUser.call(baseWorld, "new");
        // Then I get an error
        Request.failed.call(baseWorld);
    });
});

// Scenario: User accepting invite joins business
test("User accepting invite joins business", async () => {
    // before
    await Helpers.Api.setup.call(baseWorld, "@setup_accept_invite");

    // Given the user has received an invite
    const connection = baseWorld.getConnection();

    const user = await connection.manager.findOneOrFail(User, {
        where: { email: (attributes.inviteUser() as InviteUserProps).email },
    });

    try {
        await connection.manager.findOneOrFail(MembershipRequest, {
            where: { user_id: user.id },
        });
    } catch (e) {
        console.log(e);
        await actions.inviteUser.call(baseWorld, "new");
    }

    // When the user accepts the invite
    await actions.acceptInvite.call(baseWorld);

    // Then the user is a member of the business
    const membership = await connection.manager.findOneOrFail(Membership, {
        where: { user_id: user.id },
    });

    expect(membership).toBeTruthy();
});
