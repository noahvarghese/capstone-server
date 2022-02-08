import Department from "@models/department";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { registerHandler } from "@routes/auth/register/handler";
import DBConnection from "@test/support/db_connection";
import { setupAdmin } from "@test/unit/setup";
import { unitTeardown } from "@test/unit/teardown";

test.todo("db connection failed");

describe("requires db connection", () => {
    beforeAll(DBConnection.init);
    afterAll(DBConnection.close);

    describe("requires admin user", () => {
        let business_id: number, user_id: number;

        beforeAll(async () => {
            // Create admin user
            ({ business_id, user_id } = await setupAdmin(
                await DBConnection.get()
            ));
        });

        afterAll(async () => unitTeardown(await DBConnection.get()));

        describe("requires secondary user", () => {
            beforeAll(async () => {
                // create secondary user/department/role/user role
                const conn = await DBConnection.get();
                const [
                    {
                        identifiers: [{ id: secondaryUserId }],
                    },
                    {
                        identifiers: [{ id: department_id }],
                    },
                ] = await Promise.all([
                    conn.manager.insert(
                        User,
                        new User({
                            first_name: "test",
                            last_name: "test",
                            email: process.env.TEST_EMAIL_2 ?? "",
                        })
                    ),
                    conn.manager.insert(
                        Department,
                        new Department({
                            name: "test",
                            business_id,
                            updated_by_user_id: user_id,
                        })
                    ),
                ]);

                const {
                    identifiers: [{ id: role_id }],
                } = await conn.manager.insert(
                    Role,
                    new Role({
                        updated_by_user_id: user_id,
                        department_id,
                        name: "test",
                    })
                );

                await conn.manager.insert(
                    UserRole,
                    new UserRole({ user_id: secondaryUserId, role_id })
                );
                return;
            });

            describe("permissions", () => {
                test.todo("admin");
                test.todo("department");
                test.todo("none");
            });

            describe("pagination", () => {
                test.todo("limit");
                test.todo("page");
            });

            describe("filter", () => {
                return;
            });

            describe("search", () => {
                return;
            });

            describe("sort", () => {
                return;
            });
        });
    });
});
