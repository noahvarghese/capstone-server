import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import MembershipRequest from "@models/membership_request";
import User from "@models/user/user";
import { inviteMember as inviteMemberAttributes } from "@test/api/attributes/member";
import Membership from "@models/membership";
import Request from "@test/api/helpers/request";
import Event from "@models/event";
import { loginUser } from "@test/api/helpers/setup-actions";
import { login } from "@test/api/actions/auth";
import { acceptInvite, inviteMember } from "@test/api/actions/members";

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
    await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
    baseWorld.resetProps();
});

describe("Sending invites to join business", () => {
    async function receiveInvite(this: BaseWorld) {
        const connection = this.getConnection();
        const { email } = inviteMemberAttributes();

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
        await Helpers.Api.setup(baseWorld, "@setup_invite_member");
    });
    describe("Given I am logged in as and admin", () => {
        beforeEach(async () => {
            // Given I am logged in as and admin
            login.call(login, baseWorld);
        });

        test("New user invited to business", async () => {
            // When a new user is added to the business
            await inviteMember.call(inviteMember, baseWorld, "default");
            // Then the user should get an invite
            await receiveInvite.call(baseWorld);
        });

        test("Existing user invited to business", async () => {
            // When an existing user is added to the business
            await inviteMember.call(inviteMember, baseWorld, "create");
            // Then the user should get an invite
            await receiveInvite.call(baseWorld);
        });

        test("User who has received an invite gets a new invite", async () => {
            // Given a user has received an invite already
            await inviteMember.call(inviteMember, baseWorld, "default");
            const connection = baseWorld.getConnection();

            const user = await connection.manager.findOneOrFail(User, {
                where: { email: inviteMemberAttributes().email },
            });

            const { token: prevToken, token_expiry: prevTokenExpiry } =
                await connection.manager.findOneOrFail(MembershipRequest, {
                    where: { user_id: user.id },
                });

            await new Promise<void>((res) => {
                setTimeout(() => res(), 2000);
            });

            // Retrieve the existing token and token expiry
            // When the same user gets a new invite
            await inviteMember.call(inviteMember, baseWorld, "default");
            Request.succeeded.call(baseWorld);

            const { token: newToken, token_expiry: newTokenExpiry } =
                await connection.manager.findOneOrFail(MembershipRequest, {
                    where: { user_id: user.id },
                });

            expect(newToken).not.toMatch(prevToken);
            expect(newTokenExpiry.toString()).not.toMatch(
                prevTokenExpiry.toString()
            );
        });
    });

    test("Non admin cannot invite user", async () => {
        // Given I am logged in as a user
        await loginUser.call(baseWorld);
        // When a new user is added to the business
        await inviteMember.call(inviteMember, baseWorld, "default");
        // Then I get an error
        Request.failed.call(baseWorld, {
            checkCookie: false,
            include404: false,
            status: /^403$/,
            message: /^insufficient permissions$/i,
        });
    });
});

// Scenario: User accepting invite joins business
test("User accepting invite joins business", async () => {
    // before
    await Helpers.Api.setup(baseWorld, "@setup_accept_invite");

    // Given the user has received an invite
    const connection = baseWorld.getConnection();

    const user = await connection.manager.findOneOrFail(User, {
        where: { email: inviteMemberAttributes().email },
    });

    try {
        await connection.manager.findOneOrFail(MembershipRequest, {
            where: { user_id: user.id },
        });
    } catch (e) {
        await inviteMember.call(inviteMember, baseWorld, "default");
    }

    // When the user accepts the invite
    await acceptInvite.call(acceptInvite, baseWorld);

    // Then the user is a member of the business
    const membership = await connection.manager.findOneOrFail(Membership, {
        where: { user_id: user.id },
    });

    expect(membership).toBeTruthy();
});
