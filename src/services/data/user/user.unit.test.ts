import Business from "@models/business";
import Membership from "@models/membership";
import User from "@models/user/user";
import { businessAttributes, userAttributes } from "@test/model/attributes";
import DBConnection from "@test/support/db_connection";
import { findByLogin } from ".";

beforeEach(DBConnection.init);
afterEach(async () => {
    await DBConnection.close(true);
});

describe("Login", () => {
    test("Invalid email", async () => {
        const connection = await DBConnection.get();
        let errorMessage = "";

        try {
            await findByLogin(
                connection,
                "notmyemail@gmail.com",
                "doesntmatteranyway"
            );
        } catch (e) {
            const { message } = e as Error;
            errorMessage = message;
        }

        expect(errorMessage).toMatch(/^invalid login (.*)$/i);
    });

    describe("Requires a user", () => {
        let user: User, businessId: number;

        beforeEach(async () => {
            const connection = await DBConnection.get();

            businessId = (
                await connection.manager.insert(
                    Business,
                    new Business(businessAttributes())
                )
            ).identifiers[0].id;

            user = new User(userAttributes());
            await user.hashPassword(user.password);
            user.id = (
                await connection.manager.insert(User, user)
            ).identifiers[0].id;
        });

        describe("Requires a registered user", () => {
            beforeEach(async () => {
                const connection = await DBConnection.get();
                await connection.manager.insert(
                    Membership,
                    new Membership({
                        business_id: businessId,
                        user_id: user.id,
                        updated_by_user_id: user.id,
                        default: true,
                    })
                );
            });

            test("Invalid password", async () => {
                const connection = await DBConnection.get();
                const user = new User(userAttributes());

                let errorMessage = "";

                try {
                    await findByLogin(
                        connection,
                        user.email,
                        "doesntmatteranyway"
                    );
                } catch (e) {
                    const { message } = e as Error;
                    errorMessage = message;
                }

                expect(errorMessage).toMatch(/^invalid login$/i);
            });

            test("Valid login", async () => {
                const connection = await DBConnection.get();
                const userAttr = userAttributes();
                const id = await findByLogin(
                    connection,
                    userAttr.email,
                    userAttr.password
                );
                expect(id).toBeGreaterThan(0);
            });
        });
    });
});
