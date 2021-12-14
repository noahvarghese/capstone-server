import Business from "@models/business";
import Department from "@models/department";
import Membership from "@models/membership";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { businessAttributes, userAttributes } from "@test/model/attributes";
import DBConnection from "@test/support/db_connection";
import { Connection } from "typeorm";
import { findByLogin } from ".";
import * as userMembershipService from "@services/data/user/members/index";

beforeAll(async () => await DBConnection.init());
afterAll(async () => {
    await DBConnection.close(true);
});

describe("Login", () => {
    test("Invalid email", async () => {
        let errorMessage = "";

        try {
            await findByLogin("notmyemail@gmail.com", "doesntmatteranyway");
        } catch (e) {
            const { message } = e as Error;
            errorMessage = message;
        }

        expect(errorMessage).toMatch(/^invalid login (.*)$/i);
    });

    describe("Requires a user", () => {
        let user: User, businessId: number;
        let connection: Connection;

        beforeAll(async () => {
            connection = await DBConnection.get();

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

        afterAll(async () => {
            await Promise.all([
                connection.manager.delete(User, user.id),
                connection.manager.delete(Business, businessId),
            ]);
        });

        describe("Requires a registered user", () => {
            const membershipKeys: { user_id?: number; business_id?: number } =
                {};

            beforeAll(async () => {
                const res = await connection.manager.insert(
                    Membership,
                    new Membership({
                        business_id: businessId,
                        user_id: user.id,
                        updated_by_user_id: user.id,
                        default: true,
                    })
                );
                membershipKeys.user_id = res.identifiers[0].user_id;
                membershipKeys.business_id = res.identifiers[0].business_id;
            });

            afterAll(async () => {
                await connection.manager.delete(Membership, membershipKeys);
            });

            test("Invalid password", async () => {
                const user = new User(userAttributes());

                let errorMessage = "";

                try {
                    await findByLogin(user.email, "doesntmatteranyway");
                } catch (e) {
                    const { message } = e as Error;
                    errorMessage = message;
                }

                expect(errorMessage).toMatch(/^invalid login$/i);
            });

            test("Valid login", async () => {
                const userAttr = userAttributes();
                const id = await findByLogin(userAttr.email, userAttr.password);
                expect(id).toBeGreaterThan(0);
            });
        });
    });
});

describe("Get all users", () => {
    let user: User, businessId: number;
    let connection: Connection;
    beforeAll(async () => {
        // Create business
        // Login

        connection = await DBConnection.get();

        user = new User(userAttributes());
        await user.hashPassword(user.password);

        const res = await Promise.all([
            connection.manager.insert(
                Business,
                new Business(businessAttributes())
            ),
            connection.manager.insert(User, user),
        ]);

        businessId = res[0].identifiers[0].id;
        user.id = res[1].identifiers[0].id;

        await connection.manager.insert(
            Membership,
            new Membership({
                user_id: user.id,
                business_id: businessId,
                updated_by_user_id: user.id,
                default: true,
            })
        );

        const dept = await connection.manager.insert(
            Department,
            new Department({
                business_id: businessId,
                name: "test",
                updated_by_user_id: user.id,
            })
        );
        const permission = await connection.manager.insert(
            Permission,
            new Permission({ updated_by_user_id: user.id })
        );
        const role = await connection.manager.insert(
            Role,
            new Role({
                updated_by_user_id: user.id,
                name: "TEST",
                permission_id: permission.identifiers[0].id,
                department_id: dept.identifiers[0].id,
            })
        );
        const role1 = await connection.manager.insert(
            Role,
            new Role({
                updated_by_user_id: user.id,
                name: "TEST123",
                permission_id: permission.identifiers[0].id,
                department_id: dept.identifiers[0].id,
            })
        );
        await connection.manager.insert(
            UserRole,
            new UserRole({
                user_id: user.id,
                role_id: role.identifiers[0].id,
                updated_by_user_id: user.id,
            })
        );
        await connection.manager.insert(
            UserRole,
            new UserRole({
                user_id: user.id,
                role_id: role1.identifiers[0].id,
                updated_by_user_id: user.id,
            })
        );
    });

    afterAll(async () => {
        await connection.manager.delete(
            UserRole,
            await connection.manager.find(UserRole)
        );
        await connection.manager.delete(
            Role,
            await connection.manager.find(Role)
        );
        await connection.manager.delete(
            Permission,
            await connection.manager.find(Permission)
        );
        await connection.manager.delete(
            Department,
            await connection.manager.find(Department)
        );
        await connection.manager.delete(Membership, {
            user_id: user.id,
            business_id: businessId,
        });
        await Promise.all([
            connection.manager.delete(User, user.id),
            connection.manager.delete(Business, businessId),
        ]);
    });

    test("reads correctly", async () => {
        const res = await userMembershipService.get(
            { limit: 5, page: 1 },
            businessId
        );
        expect(res.length).toBe(1);
        expect(res[0].roles.length).toBe(2);
    });
});
