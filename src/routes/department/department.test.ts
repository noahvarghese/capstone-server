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
} from "@test/api/actions/departments";
import Request from "@test/api/helpers/request";
import Department from "@models/department";

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

    test("Global admin can create department", async () => {
        // When I create a department
        await createDepartment.call(createDepartment, baseWorld);
        // Then a new department exists
        Request.succeeded.call(baseWorld, { auth: false });
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
});

describe("User who lacks CRUD rights", () => {
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
});
