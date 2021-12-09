import Business from "@models/business";
import Event from "@models/event";
import Membership from "@models/membership";
import MembershipRequest from "@models/membership_request";
import User from "@models/user/user";
import { inviteMember } from "@test/api/attributes/member";
import { businessAttributes, userAttributes } from "@test/model/attributes";
import DBConnection from "@test/support/db_connection";
import { InsertResult } from "typeorm";
import { acceptInvite, sendInvite } from ".";

beforeAll(async () => {
    await DBConnection.init();
});

afterAll(async () => {
    await DBConnection.close();
});

describe("Create user before sending invite", () => {
    let startingRes: [InsertResult, InsertResult, InsertResult];
    beforeAll(async () => {
        const connection = await DBConnection.get();
        // create admin + business
        // create new user
        startingRes = await Promise.all([
            connection.manager.insert(Business, businessAttributes()),
            connection.manager.insert(User, new User(userAttributes())),
            connection.manager.insert(User, new User(inviteMember())),
        ]);

        // send invite
        await sendInvite(
            connection,
            inviteMember(),
            startingRes[0].identifiers[0].id,
            startingRes[1].identifiers[0].id
        );
    });

    afterAll(async () => await DBConnection.reset());

    test("doesn't create a new user", async () => {
        const connection = await DBConnection.get();
        // check that membership request was made
        const membershipRequest = await connection.manager.findOne(
            MembershipRequest,
            {
                where: {
                    user_id: startingRes[2].identifiers[0].id,
                    business_id: startingRes[0].identifiers[0].id,
                },
            }
        );

        expect(membershipRequest).not.toBe(undefined);
    });
    test("sends email", async () => {
        const connection = await DBConnection.get();
        // check that the email was sent
        const event = await connection.manager.findOne(Event, {
            where: {
                business_id: startingRes[0].identifiers[0].id,
                user_id: startingRes[2].identifiers[0].id,
                status: "PASS",
                name: "User Invite Email",
            },
        });

        expect(event).not.toBe(undefined);
    });

    test("preexisting membership request updates token", async () => {
        const connection = await DBConnection.get();

        const membershipRequest1 = await connection.manager.findOne(
            MembershipRequest,
            {
                where: {
                    user_id: startingRes[2].identifiers[0].id,
                    business_id: startingRes[0].identifiers[0].id,
                },
            }
        );

        // resend invite
        await sendInvite(
            connection,
            inviteMember(),
            startingRes[0].identifiers[0].id,
            startingRes[1].identifiers[0].id
        );

        const membershipRequest2 = await connection.manager.findOne(
            MembershipRequest,
            {
                where: {
                    user_id: startingRes[2].identifiers[0].id,
                    business_id: startingRes[0].identifiers[0].id,
                },
            }
        );

        if (!membershipRequest1 || !membershipRequest2)
            throw new Error("MembershipRequests not defined");

        expect(membershipRequest1.token).not.toBe(undefined);
        expect(membershipRequest2.token).not.toBe(undefined);
        expect(membershipRequest1.token_expiry).not.toBe(undefined);
        expect(membershipRequest2.token_expiry).not.toBe(undefined);

        expect(membershipRequest1.token).not.toBe(membershipRequest2.token);
        expect(membershipRequest1.token_expiry).not.toBe(
            membershipRequest2.token_expiry
        );
    });
});

describe("Valid membership acceptance", () => {
    let startingRes: [InsertResult, InsertResult, InsertResult];

    beforeAll(async () => {
        const connection = await DBConnection.get();
        // create admin + business
        // create new user
        startingRes = await Promise.all([
            connection.manager.insert(Business, businessAttributes()),
            connection.manager.insert(User, new User(userAttributes())),
            connection.manager.insert(User, new User(inviteMember())),
        ]);

        // create invite
        await connection.manager.insert(
            MembershipRequest,
            new MembershipRequest({
                user_id: startingRes[2].identifiers[0].id,
                business_id: startingRes[0].identifiers[0].id,
                updated_by_user_id: startingRes[1].identifiers[0].id,
            })
        );

        const membershipRequest = await connection.manager.findOneOrFail(
            MembershipRequest,
            {
                where: {
                    user_id: startingRes[2].identifiers[0].id,
                    business_id: startingRes[0].identifiers[0].id,
                },
            }
        );

        // accept invite
        await acceptInvite(connection, membershipRequest.token);
    });
    afterAll(async () => await DBConnection.reset());
    test("No previous membership, creates default", async () => {
        const connection = await DBConnection.get();

        // check that only one membership exists for user with default set
        const membership = await connection.manager.find(Membership, {
            where: {
                user_id: startingRes[2].identifiers[0].id,
            },
        });

        expect(membership.length).toBe(1);
        expect(membership[0].default).toBe(true);
    });

    test("Membership request deleted after accceptance", async () => {
        const connection = await DBConnection.get();

        const membershipRequests = await connection.manager.find(
            MembershipRequest,
            {
                where: {
                    user_id: startingRes[2].identifiers[0].id,
                },
            }
        );

        expect(membershipRequests.length).toBe(0);
    });
});

describe("Reset database after each", () => {
    afterEach(async () => await DBConnection.reset());

    describe("Send invite", () => {
        test("New user, creates user", async () => {
            const connection = await DBConnection.get();
            // create admin + business
            // create new user
            const startingRes = await Promise.all([
                connection.manager.insert(Business, businessAttributes()),
                connection.manager.insert(User, new User(userAttributes())),
            ]);

            // send invite
            await sendInvite(
                connection,
                inviteMember(),
                startingRes[0].identifiers[0].id,
                startingRes[1].identifiers[0].id
            );

            // check that membership request was made
            const [membershipRequest, user] = await Promise.all([
                connection.manager.findOne(MembershipRequest, {
                    where: {
                        business_id: startingRes[0].identifiers[0].id,
                    },
                }),
                connection.manager.findOne(User, {
                    where: { email: inviteMember().email },
                }),
            ]);

            if (!membershipRequest || !user)
                throw new Error(
                    "Model not created " +
                        (!user ? "User" : "MembershipRequest")
                );

            expect(membershipRequest).not.toBe(undefined);
            expect(membershipRequest.user_id).toBe(user.id);
        });

        test("User that is a member doesn't get an invite", async () => {
            const connection = await DBConnection.get();
            // create admin + business
            // create new user
            const startingRes = await Promise.all([
                connection.manager.insert(Business, businessAttributes()),
                connection.manager.insert(User, new User(userAttributes())),
                connection.manager.insert(User, new User(inviteMember())),
            ]);

            await connection.manager.insert(
                Membership,
                new Membership({
                    user_id: startingRes[2].identifiers[0].id,
                    business_id: startingRes[0].identifiers[0].id,
                })
            );

            let errorMessage = "";

            try {
                // send invite
                await sendInvite(
                    connection,
                    inviteMember(),
                    startingRes[0].identifiers[0].id,
                    startingRes[1].identifiers[0].id
                );
            } catch (e) {
                const { message } = e as Error;
                errorMessage = message;
            }

            expect(errorMessage).toMatch(
                /^user is a member of the business already$/i
            );
        });
    });

    describe("Accept invite", () => {
        test("Previous membership, adds new membership that is not default", async () => {
            const connection = await DBConnection.get();
            // create admin + businesses
            // create new user
            const startingRes = await Promise.all([
                connection.manager.insert(Business, businessAttributes()),
                connection.manager.insert(Business, {
                    ...businessAttributes(),
                    name: "TEST",
                }),
                connection.manager.insert(User, new User(userAttributes())),
                connection.manager.insert(User, new User(inviteMember())),
            ]);

            // assign second user to second business
            // and create invite for second user to first business
            await Promise.all([
                connection.manager.insert(
                    Membership,
                    new Membership({
                        user_id: startingRes[3].identifiers[0].id,
                        business_id: startingRes[1].identifiers[0].id,
                        updated_by_user_id: startingRes[3].identifiers[0].id,
                        default: true,
                    })
                ),
                connection.manager.insert(
                    MembershipRequest,
                    new MembershipRequest({
                        user_id: startingRes[3].identifiers[0].id,
                        business_id: startingRes[0].identifiers[0].id,
                        updated_by_user_id: startingRes[3].identifiers[0].id,
                    })
                ),
            ]);

            // get the token to accept
            const membershipRequest = await connection.manager.findOneOrFail(
                MembershipRequest,
                {
                    where: {
                        user_id: startingRes[3].identifiers[0].id,
                        business_id: startingRes[0].identifiers[0].id,
                    },
                }
            );

            await acceptInvite(connection, membershipRequest.token);

            // get all memberships for second user
            const memberships = await Promise.all([
                connection.manager.findOneOrFail(Membership, {
                    where: {
                        user_id: startingRes[3].identifiers[0].id,
                        business_id: startingRes[1].identifiers[0].id,
                    },
                }),
                connection.manager.findOneOrFail(Membership, {
                    where: {
                        user_id: startingRes[3].identifiers[0].id,
                        business_id: startingRes[0].identifiers[0].id,
                    },
                }),
            ]);
            // check that the membership to first business is not default
            expect(memberships[0].default).toBe(true);
            // check that the membership to second business is default
            expect(memberships[1].default).toBe(false);
        });
    });
});

test("Accepting an invite without a valid token doesn't work", async () => {
    const connection = await DBConnection.get();

    let errorMessage = "";
    try {
        await acceptInvite(connection, "InvalidToken");
    } catch (e) {
        const { message } = e as Error;
        errorMessage = message;
    }
    expect(errorMessage).toMatch(
        /^no invitation found, please ask your manager for a new invitation$/i
    );
});
