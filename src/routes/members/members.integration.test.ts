import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import { login } from "@test/api/actions/auth";
import {
    assignUserToRole,
    createDepartment,
    createRole,
    getAdminUserId,
    loginUser,
} from "@test/api/helpers/setup-actions";
import {
    deleteMember,
    readManyMembers,
    readOneMember,
    updateMember,
} from "@test/api/actions/members";
import { registerBusiness } from "@test/api/attributes/business";
import Request from "@test/api/helpers/request";
import { deepClone } from "@util/obj";
import Department from "@models/department";
import Role from "@models/role";
import { EmptyPermissionAttributes } from "@models/permission";
import Membership from "@models/membership";
import User from "@models/user/user";
import { ReadMember } from ".";

let baseWorld: BaseWorld;
jest.setTimeout(500000);

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

    test("Global admin can read a list of members", async () => {
        const user_id = await getAdminUserId.call(baseWorld);
        await readManyMembers.call(readManyMembers, baseWorld);
        const response = baseWorld.getCustomProp<ReadMember[]>("responseData");

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
            baseWorld.getCustomProp<ReadMember>("responseData");

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

    test("Invalid sort field", async () => {
        await readManyMembers.call(readManyMembers, baseWorld, {
            query: { sortField: "TEST123" },
        });

        Request.failed.call(baseWorld, {
            status: /^400$/,
            message: /^invalid field to sort by \w*$/i,
            include404: false,
        });
    });

    describe("Create 2 users, but operate as admin", () => {
        beforeEach(async () => {
            // Create a second user to test pagination with
            baseWorld.setCustomProp("user", await loginUser.call(baseWorld));
            // login as admin who can read evey user
            await login.call(login, baseWorld);
        });
        test("Pagination", async () => {
            // request first page
            await readManyMembers.call(readManyMembers, baseWorld, {
                query: { page: 1, limit: 1 },
            });

            const res1 = baseWorld.getCustomProp<ReadMember[]>("responseData");

            // request second page
            await readManyMembers.call(readManyMembers, baseWorld, {
                query: { page: 2, limit: 1 },
            });

            // make sure a different user was returned
            const res2 = baseWorld.getCustomProp<ReadMember[]>("responseData");
            expect(JSON.stringify(res1)).not.toBe(JSON.stringify(res2));
        });

        test("limit the amount of users returned per page", async () => {
            // request first page
            await readManyMembers.call(readManyMembers, baseWorld, {
                query: { limit: 1 },
            });
            const res1 = baseWorld.getCustomProp<ReadMember[]>("responseData");
            expect(res1.length).toBe(1);

            // request second page
            await readManyMembers.call(readManyMembers, baseWorld, {
                query: { limit: 2 },
            });

            // make sure a different user was returned
            const res2 = baseWorld.getCustomProp<ReadMember[]>("responseData");
            expect(res2.length).toBe(2);
        });
        describe("Sorting", () => {
            const cases = [
                ["birthday", "ASC"],
                ["birthday", "DESC"],
                ["first_name", "ASC"],
                ["first_name", "DESC"],
                ["last_name", "ASC"],
                ["last_name", "DESC"],
                ["email", "ASC"],
                ["email", "DESC"],
                ["phone", "ASC"],
                ["phone", "DESC"],
            ];

            test.each(cases)(
                "given sort field %p and sort order %p, the results will match",
                async (sortField, sortOrder) => {
                    await readManyMembers.call(readManyMembers, baseWorld, {
                        query: { sortField, sortOrder },
                    });

                    const res =
                        baseWorld.getCustomProp<ReadMember[]>("responseData");
                    expect(res.length).toBeGreaterThan(1);
                    const resCopy = deepClone(res);
                    const sortedRes = resCopy.sort((a, b): number => {
                        const aVal = JSON.stringify(
                            (a.user as unknown as { [o: string]: string })[
                                sortField
                            ]
                        );

                        const bVal = JSON.stringify(
                            (b.user as unknown as { [o: string]: string })[
                                sortField
                            ]
                        );

                        if (sortOrder === "ASC") {
                            return aVal < bVal ? -1 : aVal === bVal ? 0 : 1;
                        } else if (sortOrder === "DESC") {
                            return aVal < bVal ? 1 : aVal === bVal ? 0 : -1;
                        } else throw new Error("Invalid sort order");
                    });

                    expect(JSON.stringify(res)).toBe(JSON.stringify(sortedRes));
                }
            );
        });

        describe("Searching", () => {
            const cases = [
                // Searches based on Department
                [["roles", 0, "department", "name"], "adm"],
                // Search based on first_name
                [["user", "first_name"], "No"],
                // last_name
                [["user", "last_name"], "Va"],
                // email
                [["user", "email"], "gmai"],
                // role
                [["roles", 0, "name"], "gene"],
                // birthday
                [["user", "birthday"], "1996"],
                // phone
                [["user", "phone"], "647"],
            ];

            test.each(cases)(
                "Search field %p, search item %p",
                async (keys, searchItem) => {
                    await readManyMembers.call(readManyMembers, baseWorld, {
                        query: { search: searchItem },
                    });

                    const res =
                        baseWorld.getCustomProp<ReadMember[]>("responseData");

                    for (const member of res) {
                        let result: ReadMember | string | unknown = member;
                        for (const key of keys) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            result = (result as any)[
                                key as keyof typeof keys
                            ] as string;
                        }
                        expect((result as string).toLowerCase()).toContain(
                            searchItem.toString().toLowerCase()
                        );
                    }
                }
            );
        });

        describe("Filtering", () => {
            const cases: [string, typeof Department | typeof Role][] = [
                ["department", Department],
                ["role", Role],
            ];
            const name = "TEST";

            beforeEach(async () => {
                // create second department and role
                // assign 2nd user to it
                await createDepartment.call(baseWorld, name);
                const roleId = await createRole.call(baseWorld, name, name, {
                    ...EmptyPermissionAttributes(),
                    updated_by_user_id: await getAdminUserId.call(baseWorld),
                });
                const { id } = baseWorld.getCustomProp<{ id: number }>("user");
                await assignUserToRole.call(
                    baseWorld,
                    id,
                    roleId,
                    undefined,
                    true
                );
            });
            test.each(cases)(
                "Filtering by %p",
                async (fieldName, fieldType) => {
                    const connection = baseWorld.getConnection();

                    const model = await connection.manager.findOne(fieldType, {
                        where: { name },
                    });

                    await readManyMembers.call(readManyMembers, baseWorld, {
                        query: {
                            filterField: fieldName,
                            filterIds: [model?.id],
                        },
                    });

                    Request.succeeded.call(baseWorld);

                    const res =
                        baseWorld.getCustomProp<ReadMember[]>("responseData");

                    // Because we are only creating one extra user
                    expect(res.length).toBe(1);

                    for (const item of res) {
                        if (fieldName === "department") {
                            const foundDepartment = item.roles.find((r) => {
                                const res = r.department.name === name;
                                return res;
                            });
                            expect(foundDepartment).toBeTruthy();
                        } else {
                            const foundRole = item.roles.find((r) => {
                                const res = r.name === name;
                                return res;
                            });
                            expect(foundRole).toBeTruthy();
                        }
                    }
                }
            );
        });
        // Scenario: Global Admin Can Delete Membership
        test("Deleting a user from business", async () => {
            const connection = baseWorld.getConnection();

            const { id } = baseWorld.getCustomProp<{ id: number }>("user");

            // pre test check
            let membership = await connection.manager.findOne(Membership, {
                where: { user_id: id },
            });

            expect(membership).not.toBe(undefined);

            //     When I delete a membership
            await deleteMember.call(deleteMember, baseWorld, id);

            // check success
            Request.succeeded.call(baseWorld);
            membership = await connection.manager.findOne(Membership, {
                where: { user_id: id },
            });

            //     Then a membership is deleted);
            expect(membership).toBe(undefined);
        });

        describe("Update user", () => {
            const cases: [
                "birthday" | "first_name" | "last_name" | "email" | "phone",
                string | Date
            ][] = [
                ["birthday", new Date(2021, 11, 21)],
                ["first_name", "NOT_TEST"],
                ["last_name", "NOT_TEST"],
                ["email", "this_is_a_test@test.com"],
                ["phone", "9058279585"],
            ];
            test.each(cases)(
                "Update user field %p value %p",
                async (field, val) => {
                    const { id } =
                        baseWorld.getCustomProp<{ id: number }>("user");
                    const connection = baseWorld.getConnection();

                    const user = await connection.manager.findOne(User, {
                        where: { id },
                    });

                    if (!user) throw new Error("User not defined");

                    if (field === "birthday") user[field] = val as Date;
                    else user[field] = val as string;

                    await updateMember.call(updateMember, baseWorld, user);

                    Request.succeeded.call(baseWorld);

                    const updatedUser = await connection.manager.findOne(User, {
                        where: { id },
                    });

                    if (!updatedUser)
                        throw new Error("Updated user not defined");

                    expect(updatedUser.updated_on.toISOString()).not.toBe(
                        user.updated_on.toISOString()
                    );
                    expect(updatedUser[field].toString()).toBe(
                        user[field].toString()
                    );
                }
            );
        });
    });
});
