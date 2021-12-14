import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import { login } from "@test/api/actions/auth";
import {
    createDepartment,
    createRole,
    getAdminUserId,
    getBusiness,
    loginUser,
} from "@test/api/helpers/setup-actions";
import {
    deleteMember,
    readManyMembers,
    readOneMember,
    roleAssignment,
    roleRemoval,
    updateMember,
} from "@test/api/actions/members";
import { registerBusiness } from "@test/api/attributes/business";
import Request from "@test/api/helpers/request";
import { EmptyPermissionAttributes } from "@models/permission";
import Membership from "@models/membership";
import User from "@models/user/user";
import { Connection } from "typeorm";
import { deepClone } from "@util/obj";
import Department from "@models/department";
import Role from "@models/role";
import UserRole from "@models/user/user_role";
import Logs from "@util/logs/logs";
import { ReadMember } from "@services/data/user/members";

let baseWorld: BaseWorld;
const name = "TEST";
const business = registerBusiness();
let adminId: number;
let roleId: number;
let userLogin: { id: number; email: string; password: string };

const assignToRole = async () => {
    await baseWorld.getConnection().manager.insert(
        UserRole,
        new UserRole({
            user_id: userLogin.id,
            role_id: roleId,
            updated_by_user_id: userLogin.id,
            primary_role_for_user: true,
        })
    );
};

beforeAll(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Helpers.Api.setup(baseWorld, "@setup_invite_member");
    // Given I am logged in as an admin
    await login.call(login, baseWorld);

    const res = await Promise.all([
        getAdminUserId.call(baseWorld),
        // Create role to assign user to
        createDepartment.call(baseWorld, name),
    ]);
    adminId = res[0];

    const [userRes, roleRes] = await Promise.all([
        // create user to change
        loginUser.call(baseWorld),
        createRole.call(baseWorld, name, name, {
            ...EmptyPermissionAttributes(),
            updated_by_user_id: adminId,
        }),
    ]);
    userLogin = userRes;
    roleId = roleRes;

    // login as admin who can read evey user
    await login.call(login, baseWorld);
    await assignToRole();
});

afterAll(async () => {
    await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
});

describe("Basic user management", () => {
    jest.setTimeout(500000);

    describe("Read list of members", () => {
        test("Invalid sort field", async () => {
            await readManyMembers.call(readManyMembers, baseWorld, {
                query: { sortField: "TEST123" },
            });

            Request.failed.call(baseWorld, {
                status: /^400$/,
                message: /^invalid field to sort by: \w*$/i,
                include404: false,
            });
        });

        test("Default read", async () => {
            await readManyMembers.call(readManyMembers, baseWorld);
            const response =
                baseWorld.getCustomProp<ReadMember[]>("responseData");

            Request.succeeded.call(baseWorld);
            // This should be sorted by created_on DESC (so admin is last)
            expect(response.length).toBe(2);

            const { user, roles } = response[1];

            expect(roles.length).toBe(1);

            const role = roles[0];

            expect(user.birthday).toBe(null);
            expect(user.first_name).toBe(business.first_name);
            expect(user.last_name).toBe(business.last_name);
            expect(user.email).toBe(business.email);
            expect(user.phone).toBe(business.phone);
            expect(user.id).toBe(adminId);
            expect(role.default).toBe(true);
            expect(role.name).toBe("General");
            expect(role.department.name).toBe("Admin");
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
                [["user", "first_name"], "ah"],
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
    });

    test("Global admin can read individual members", async () => {
        await readOneMember.call(readOneMember, baseWorld, adminId);
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
        expect(user.id).toBe(adminId);
        expect(role.default).toBe(true);
        expect(role.name).toBe("General");
        expect(role.department.name).toBe("Admin");
    });

    // Scenario: Global Admin Can Delete Membership
    describe("Deleting a user from business", () => {
        afterEach(async () => {
            // create membership again
            const businessId = await getBusiness.call(baseWorld);
            await baseWorld.getConnection().manager.insert(
                Membership,
                new Membership({
                    user_id: userLogin.id,
                    business_id: businessId,
                    default: true,
                    updated_by_user_id: userLogin.id,
                })
            );
        });
        it("Should be successful", async () => {
            const connection = baseWorld.getConnection();

            const { id: user_id } = userLogin;

            // pre test check
            await connection.manager.findOneOrFail(Membership, {
                where: { user_id },
            });

            //     When I delete a membership
            await deleteMember.call(deleteMember, baseWorld, user_id);

            // check success
            Request.succeeded.call(baseWorld);
        });
    });

    describe("Update user", () => {
        type UserUpdateFields =
            | "birthday"
            | "first_name"
            | "last_name"
            | "email"
            | "phone";

        const cases: [UserUpdateFields, string | Date][] = [
            ["birthday", new Date(2021, 11, 21)],
            ["first_name", "NOT_TEST"],
            ["last_name", "NOT_TEST"],
            ["email", "this_is_a_test@test.com"],
            ["phone", "9058279585"],
        ];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let originalValue: any;
        let user: User;
        let connection: Connection;

        beforeAll(async () => {
            connection = baseWorld.getConnection();

            user = await connection.manager.findOneOrFail(User, {
                where: { id: userLogin.id },
            });
        });

        describe.each(cases)("Update user field %p value %p", (field, val) => {
            beforeEach(async () => {
                originalValue = user[field];
            });
            afterEach(async () => {
                // Reset field
                await connection.manager.update(
                    User,
                    { id: user.id },
                    { [field]: originalValue }
                );
            });
            it("Updates field", async () => {
                if (field === "birthday") user[field] = val as Date;
                else user[field] = val as string;

                await updateMember.call(updateMember, baseWorld, user);

                Request.succeeded.call(baseWorld);

                const updatedUser = await connection.manager.findOneOrFail(
                    User,
                    {
                        where: { id: userLogin.id },
                    }
                );

                expect(updatedUser[field].toString()).toBe(
                    user[field].toString()
                );
            });
        });
    });
});

describe("Can manage user -> role assignments", () => {
    const removeFromRole = async () => {
        await baseWorld.getConnection().manager.delete(UserRole, {
            user_id: userLogin.id,
            role_id: roleId,
        });
    };

    describe("Can assign user to role(s)", () => {
        beforeEach(async () => {
            await removeFromRole();
        });
        afterEach(async () => {
            try {
                await assignToRole();
            } catch (_) {
                Logs.Test("Task failed succesfully");
            }
        });
        it("Should add user to the role(s)", async () => {
            await roleAssignment.call(roleAssignment, baseWorld, userLogin.id, [
                roleId,
            ]);
            Request.succeeded.call(baseWorld);
        });
    });

    describe("Can remove user from role(s)", () => {
        afterEach(async () => {
            await assignToRole();
        });
        it("Should remove user from the role(s)", async () => {
            // when the role is removed
            await roleRemoval.call(roleRemoval, baseWorld, userLogin.id, [
                roleId,
            ]);

            // The request is successful
            Request.succeeded.call(baseWorld);

            const userRole = await baseWorld
                .getConnection()
                .manager.findOne(UserRole, {
                    where: { user_id: userLogin.id, role_id: roleId },
                });

            // user role should be deleted
            expect(userRole).toBe(undefined);
        });
    });
});
