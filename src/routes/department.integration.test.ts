import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import {
    createDepartment as createDepartmentByName,
    getBusiness,
    getDepartmentInBusiness,
} from "@test/api/helpers/setup-actions";
import { login } from "@test/api/actions/auth";
import {
    deleteDepartment,
    editDepartment,
    readManyDepartments,
    readOneDepartment,
} from "@test/api/actions/departments";
import Request from "@test/api/helpers/request";
import Department from "@models/department";
import { DepartmentResponse } from "./department";
import { deepClone } from "@util/obj";

jest.setTimeout(500000);
let baseWorld: BaseWorld;
let departmentId: number;
const name = "TEST";

beforeAll(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Helpers.Api.setup(baseWorld, "@setup_invite_member");
    // Given I am logged in as an admin
    await login.call(login, baseWorld);
    departmentId = await createDepartmentByName.call(baseWorld, name);
});

afterAll(async () => {
    await Helpers.Api.teardown(baseWorld, "@cleanup_user_role");
    baseWorld.resetProps();
});

test("Pagination", async () => {
    // request first page
    await readManyDepartments.call(readManyDepartments, baseWorld, {
        query: { page: 1, limit: 1 },
    });
    Request.succeeded.call(baseWorld, { auth: false, status: /^200$/ });

    const res1 = baseWorld.getCustomProp<DepartmentResponse[]>("responseData");

    // request second page
    await readManyDepartments.call(readManyDepartments, baseWorld, {
        query: { page: 2, limit: 1 },
    });
    Request.succeeded.call(baseWorld, { auth: false, status: /^200$/ });

    // make sure a different user was returned
    const res2 = baseWorld.getCustomProp<DepartmentResponse[]>("responseData");
    expect(JSON.stringify(res1)).not.toBe(JSON.stringify(res2));
});

test("Search", async () => {
    const search = "adm";

    await readManyDepartments.call(readManyDepartments, baseWorld, {
        query: { search },
    });

    const res = baseWorld.getCustomProp<DepartmentResponse[]>("responseData");

    for (const department of res) {
        expect(department.name.toLowerCase()).toContain(search.toLowerCase());
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
            await readManyDepartments.call(readManyDepartments, baseWorld, {
                query: { sortField, sortOrder },
            });

            const res =
                baseWorld.getCustomProp<DepartmentResponse[]>("responseData");
            expect(res.length).toBeGreaterThan(1);
            const resCopy = deepClone(res);

            const sortedRes = resCopy.sort((a, b) => {
                const aSortVal = a[sortField as keyof DepartmentResponse]
                    .toString()
                    .toUpperCase();
                const bSortVal = b[sortField as keyof DepartmentResponse]
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

describe("Can create department", () => {
    const createName = "CreateTEST";
    let tmpDepartmentId: number;

    afterEach(async () => {
        await baseWorld
            .getConnection()
            .manager.delete(Department, { id: tmpDepartmentId });
    });

    test("Global admin can create department", async () => {
        // When I create a department
        tmpDepartmentId = await createDepartmentByName.call(
            baseWorld,
            createName
        );
        // Then a new department exists
        Request.succeeded.call(baseWorld, { auth: false });
    });
});

test("can read singular department", async () => {
    const departmentId = await getDepartmentInBusiness.call(
        baseWorld,
        "Admin",
        await getBusiness.call(baseWorld)
    );

    await readOneDepartment.call(readOneDepartment, baseWorld, departmentId);

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
    const id = await createDepartmentByName.call(baseWorld, "test");

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
    await deleteDepartment.call(deleteDepartment, baseWorld, [department_id]);

    // It is not deleted
    Request.failed.call(baseWorld, {
        include404: false,
        status: /^400$/,
        message:
            /^there are users associated with this department, please reassign them$/i,
    });
});

describe("Edit department", () => {
    const newName = "Noah's test department";
    afterEach(async () => {
        await baseWorld
            .getConnection()
            .manager.update(Department, { id: departmentId }, { name });
    });
    test("User who has CRUD rights can edit department", async () => {
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
});

test("can read multiple departments", async () => {
    await readManyDepartments.call(readManyDepartments, baseWorld);
    Request.succeeded.call(baseWorld, { auth: false });
    const responseData =
        baseWorld.getCustomProp<DepartmentResponse[]>("responseData");

    expect(responseData.length).toBeGreaterThanOrEqual(1);
});
