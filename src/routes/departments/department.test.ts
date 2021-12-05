import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import {
    assignUserToRole,
    createDepartment as createDepartment2,
    createRole,
    getAdminUserId,
    getBusiness,
    getDepartmentInBusiness,
    loginUser,
} from "@test/api/helpers/setup-actions";
import { login } from "@test/api/actions/auth";
import {
    createDepartment,
    deleteDepartment,
    editDepartment,
    readManyDepartments,
    readOneDepartment,
} from "@test/api/actions/departments";
import Request from "@test/api/helpers/request";
import Department from "@models/department";
import { DepartmentResponse } from ".";
import { deepClone } from "@util/obj";

jest.setTimeout(500000);
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
    baseWorld.resetProps();
});

describe("Global admin authorized", () => {
    beforeEach(async () => {
        // Given I am logged in as an admin
        await login.call(login, baseWorld);
    });

    describe("requires a premade department", () => {
        beforeEach(async () => {
            const department = await createDepartment2.call(baseWorld, "TEST");
            baseWorld.setCustomProp("departmentId", department);
        });
        test("Pagination", async () => {
            // request first page
            await readManyDepartments.call(readManyDepartments, baseWorld, {
                query: { page: 1, limit: 1 },
            });
            Request.succeeded.call(baseWorld, { auth: false, status: /^200$/ });

            const res1 =
                baseWorld.getCustomProp<DepartmentResponse[]>("responseData");

            // request second page
            await readManyDepartments.call(readManyDepartments, baseWorld, {
                query: { page: 2, limit: 1 },
            });
            Request.succeeded.call(baseWorld, { auth: false, status: /^200$/ });

            // make sure a different user was returned
            const res2 =
                baseWorld.getCustomProp<DepartmentResponse[]>("responseData");
            expect(JSON.stringify(res1)).not.toBe(JSON.stringify(res2));
        });

        test("Search", async () => {
            const search = "adm";

            await readManyDepartments.call(readManyDepartments, baseWorld, {
                query: { search },
            });

            const res =
                baseWorld.getCustomProp<DepartmentResponse[]>("responseData");

            for (const department of res) {
                expect(department.name.toLowerCase()).toContain(
                    search.toLowerCase()
                );
            }
        });

        test("Invalid sort field", async () => {
            await readManyDepartments.call(readManyDepartments, baseWorld, {
                query: { sortField: "TEST123" },
            });

            Request.failed.call(baseWorld, {
                status: /^400$/,
                message: /^invalid field to sort by \w*$/i,
                include404: false,
            });
        });

        describe("Sorting", () => {
            const cases = [
                ["name", "ASC"],
                ["name", "DESC"],
                ["numMembers", "ASC"],
                ["numMembers", "DESC"],
                ["numRoles", "ASC"],
                ["numRoles", "DESC"],
            ];

            test.each(cases)(
                "given sort field %p and sort order %p, the results will match",
                async (sortField, sortOrder) => {
                    await readManyDepartments.call(
                        readManyDepartments,
                        baseWorld,
                        {
                            query: { sortField, sortOrder },
                        }
                    );

                    const res =
                        baseWorld.getCustomProp<DepartmentResponse[]>(
                            "responseData"
                        );
                    expect(res.length).toBeGreaterThan(1);
                    const resCopy = deepClone(res);

                    const sortedRes = resCopy.sort((a, b) => {
                        const aSortVal = a[
                            sortField as keyof DepartmentResponse
                        ]
                            .toString()
                            .toUpperCase();
                        const bSortVal = b[
                            sortField as keyof DepartmentResponse
                        ]
                            .toString()
                            .toUpperCase();
                        if (sortOrder === "ASC") {
                            if (aSortVal < bSortVal) return -1;
                            else if (aSortVal === bSortVal) return 0;
                            else return 1;
                        } else {
                            if (aSortVal > bSortVal) return -1;
                            else if (aSortVal === bSortVal) return 0;
                            else return 1;
                        }
                    });

                    expect(JSON.stringify(res)).toBe(JSON.stringify(sortedRes));
                }
            );
        });
    });

    test("Global admin can create department", async () => {
        // When I create a department
        await createDepartment.call(createDepartment, baseWorld);
        // Then a new department exists
        Request.succeeded.call(baseWorld, { auth: false });
    });

    test("can read singular department", async () => {
        const departmentId = await getDepartmentInBusiness.call(
            baseWorld,
            "Admin",
            await getBusiness.call(baseWorld)
        );

        await readOneDepartment.call(
            readOneDepartment,
            baseWorld,
            departmentId
        );

        Request.succeeded.call(baseWorld, { auth: false, status: /^200$/ });
        const res = baseWorld.getCustomProp<DepartmentResponse>("responseData");
        expect(res.numMembers).toBe("1");
        expect(res.numRoles).toBe("1");
        expect(res.name).toBe("Admin");
        expect(res.id).toBe(departmentId);
    });

    // Scenario: Global Admin Can Delete Department
    test("Global admin can delete department", async () => {
        //     Given I am logged in as an admin
        // And there is an empty department
        const id = await createDepartment2.call(baseWorld, "test");

        //     When I delete a department
        await deleteDepartment.call(deleteDepartment, baseWorld, [id]);

        //     Then a department is deleted
        Request.succeeded.call(baseWorld, { auth: false });
        const connection = baseWorld.getConnection();
        const count = await connection.manager.count(Department, {
            where: { id },
        });
        expect(count).toBe(0);
    });

    test("Deleting a department that has users still associated fails", async () => {
        // Given there is a department with users associated
        const department_id = await getDepartmentInBusiness.call(
            baseWorld,
            "Admin",
            await getBusiness.call(baseWorld)
        );

        // When a user tries to delete that department
        await deleteDepartment.call(deleteDepartment, baseWorld, [
            department_id,
        ]);

        // It is not deleted
        Request.failed.call(baseWorld, {
            include404: false,
            status: /^400$/,
            message:
                /^there are users associated with this department, please reassign them$/i,
        });
    });

    test("User who has CRUD rights can edit department", async () => {
        const newName = "Noah's test department";
        // Given there is a department
        const departmentId = await createDepartment2.call(baseWorld, "test");

        // When a user tries to edit that department
        await editDepartment.call(
            editDepartment,
            baseWorld,
            newName,
            departmentId
        );

        Request.succeeded.call(baseWorld, { auth: false });

        // Then the department is updated
        const updatedDepartment = await baseWorld
            .getConnection()
            .manager.findOneOrFail(Department, {
                where: { id: departmentId },
            });

        expect(updatedDepartment.name).toBe(newName);
    });

    test("can read multiple departments", async () => {
        await readManyDepartments.call(readManyDepartments, baseWorld);
        Request.succeeded.call(baseWorld, { auth: false });
        const responseData =
            baseWorld.getCustomProp<DepartmentResponse[]>("responseData");

        // check that the default Admin department is the first
        // we can compare others but there will be other tests for this route about sorting and filtering
        expect(responseData.length).toBeGreaterThanOrEqual(1);
        expect(responseData[0].name).toBe("Admin");
    });
});

describe("User who lacks CRUD rights", () => {
    test("cannot read multiple departments", async () => {
        // Given there is a user setup without crud permissions
        const assignedRoleId = await createRole.call(
            baseWorld,
            "assigned",
            "Admin"
        );

        //     Given I am logged in as a user
        const user = await loginUser.call(baseWorld);
        const admin = await getAdminUserId.call(baseWorld);
        await assignUserToRole.call(
            baseWorld,
            user.id,
            assignedRoleId,
            admin,
            true
        );

        // When I try to read multiple roles
        await readManyDepartments.call(readManyDepartments, baseWorld);

        // I cannot
        Request.failed.call(baseWorld, {
            include404: false,
            status: /^403$/,
            message: "Insufficient permissions",
        });
    });
    test("User who lacks CRUD department rights cannot create departments", async () => {
        // Given I am logged in as a user
        await loginUser.call(baseWorld);
        // When I create a department
        await createDepartment.call(createDepartment, baseWorld);
        // Then I get an error
        Request.failed.call(baseWorld);
    });

    // Scenario: User who lacks CRUD department rights cannot delete departments
    test("User who lacks CRUD rights cannot delete department", async () => {
        await login.call(login, baseWorld);
        const roleId = await createRole.call(baseWorld, "test", "Admin");
        const departmentId = await createDepartment2.call(baseWorld, "test");

        //     Given I am logged in as a user
        const user = await loginUser.call(baseWorld);
        const admin = await getAdminUserId.call(baseWorld);
        await assignUserToRole.call(baseWorld, user.id, roleId, admin, true);

        //     When I delete a department
        await deleteDepartment.call(deleteDepartment, baseWorld, [
            departmentId,
        ]);

        //     Then I get an error
        Request.failed.call(baseWorld, {
            include404: false,
            status: /^403$/,
            message: /^Insufficient permissions$/i,
        });
    });

    test("User who lacks CRUD rights cannot edit department", async () => {
        // Given there is a user setup without crud permissions
        await login.call(login, baseWorld);
        const roleId = await createRole.call(baseWorld, "test", "Admin");

        // Given there is a department
        const departmentId = await createDepartment2.call(baseWorld, "test");

        //     Given I am logged in as a user
        const user = await loginUser.call(baseWorld);
        const admin = await getAdminUserId.call(baseWorld);
        await assignUserToRole.call(baseWorld, user.id, roleId, admin, true);

        // When a user tries to edit that department
        const newName = "Noah's test department";
        await editDepartment.call(
            editDepartment,
            baseWorld,
            newName,
            departmentId
        );

        // Then the department is not updated
        Request.failed.call(baseWorld, {
            include404: false,
            message: /^insufficient permissions$/i,
            status: /^403$/,
        });

        const updatedDepartment = await baseWorld
            .getConnection()
            .manager.findOneOrFail(Department, {
                where: { id: departmentId },
            });

        expect(updatedDepartment.name).not.toBe(newName);
    });

    test("cannot read a singular depatment", async () => {
        // Given there is a user setup without crud permissions
        await login.call(login, baseWorld);
        const assignedRoleId = await createRole.call(
            baseWorld,
            "assigned",
            "Admin"
        );
        const departmentId = await getDepartmentInBusiness.call(
            baseWorld,
            "Admin",
            await getBusiness.call(baseWorld)
        );

        //     Given I am logged in as a user
        const user = await loginUser.call(baseWorld);
        const admin = await getAdminUserId.call(baseWorld);
        await assignUserToRole.call(
            baseWorld,
            user.id,
            assignedRoleId,
            admin,
            true
        );

        // When I try to read multiple roles
        await readOneDepartment.call(
            readOneDepartment,
            baseWorld,
            departmentId
        );

        // I cannot
        Request.failed.call(baseWorld, {
            include404: false,
            status: /^403$/,
            message: "Insufficient permissions",
        });
    });
});
