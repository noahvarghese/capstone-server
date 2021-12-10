import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import MembershipRequest from "@models/membership_request";
import User from "@models/user/user";
import { inviteMember as inviteMemberAttributes } from "@test/api/attributes/member";
import Membership from "@models/membership";
import Request from "@test/api/helpers/request";
import { login } from "@test/api/actions/auth";
import { acceptInvite, inviteMember } from "@test/api/actions/members";
import Event from "@models/event";
import { Connection } from "typeorm";

let baseWorld: BaseWorld;
let connection: Connection;
jest.setTimeout(5000000);

beforeAll(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    connection = baseWorld.getConnection();
});

describe("Sending invites to join business", () => {
    beforeAll(async () => {
        await Helpers.Api.setup(baseWorld, "@setup_invite_member");
        // Given I am logged in as and admin
        login.call(login, baseWorld);
    });
    afterAll(async () => {
        await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
        baseWorld.resetProps();
    });
    afterEach(async () => {
        await Promise.all([
            connection.manager.remove(await connection.manager.find(Event)),
            connection.manager.remove(
                MembershipRequest,
                await connection.manager.find(MembershipRequest)
            ),
        ]);
        await connection.manager.delete(User, {
            email: inviteMemberAttributes().email,
        });
    });

    test("New user invited to business", async () => {
        // When a new user is added to the business
        await inviteMember.call(
            inviteMember,
            baseWorld,
            inviteMemberAttributes()
        );
        Request.succeeded.call(baseWorld);
    });

    test("Existing user invited to business", async () => {
        await connection.manager.insert(
            User,
            new User(inviteMemberAttributes())
        );
        // When an existing user is added to the business
        await inviteMember.call(
            inviteMember,
            baseWorld,
            inviteMemberAttributes()
        );
        Request.succeeded.call(baseWorld);
    });

    test("User who has received an invite gets a new invite", async () => {
        // Given a user has received an invite already
        await inviteMember.call(
            inviteMember,
            baseWorld,
            inviteMemberAttributes()
        );

        const membershipRequestQuery = connection
            .createQueryBuilder()
            .select("m")
            .from(MembershipRequest, "m")
            .where("u.email = :email", {
                email: inviteMemberAttributes().email,
            })
            .leftJoin(User, "u", "u.id = m.user_id");

        const { token: prevToken, token_expiry: prevTokenExpiry } =
            await membershipRequestQuery.getOneOrFail();

        await new Promise<void>((res) => {
            setTimeout(() => res(), 500);
        });

        await inviteMember.call(
            inviteMember,
            baseWorld,
            inviteMemberAttributes()
        );

        const { token: newToken, token_expiry: newTokenExpiry } =
            await membershipRequestQuery.getOneOrFail();

        expect(newToken).not.toMatch(prevToken);
        expect(newTokenExpiry.toString()).not.toMatch(
            prevTokenExpiry.toString()
        );
    });
});

// Scenario: User accepting invite joins business
describe("Accepting invite", () => {
    beforeAll(async () => {
        // setup
        await Helpers.Api.setup(baseWorld, "@setup_accept_invite");
        const { token } = await connection
            .createQueryBuilder()
            .select("m")
            .from(MembershipRequest, "m")
            .where("u.email = :email", {
                email: inviteMemberAttributes().email,
            })
            .leftJoin(User, "u", "u.id = m.user_id")
            .getOneOrFail();
        // When the user accepts the invite
        await acceptInvite.call(acceptInvite, baseWorld, token);
    });

    afterAll(async () => {
        await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
        baseWorld.resetProps();
    });

    it("should create membership", async () => {
        // Then the user is a member of the business
        await connection
            .createQueryBuilder()
            .select("m")
            .from(Membership, "m")
            .where("u.email = :email", {
                email: inviteMemberAttributes().email,
            })
            .leftJoin(User, "u", "u.id = m.user_id")
            .getOneOrFail();
    });

    it("should delete the membership request", async () => {
        // Then the user is a member of the business
        const membershipRequest = await connection
            .createQueryBuilder()
            .select("m")
            .from(MembershipRequest, "m")
            .where("u.email = :email", {
                email: inviteMemberAttributes().email,
            })
            .leftJoin(User, "u", "u.id = m.user_id")
            .getOne();

        expect(membershipRequest).toBe(undefined);
    });
});
