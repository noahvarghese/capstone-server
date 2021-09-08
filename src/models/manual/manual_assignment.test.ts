/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    businessAttributes,
    departmentAttributes,
    manualAssignmentAttributes,
    manualAttributes,
    permissionAttributes,
    roleAttributes,
    userAttributes,
} from "../../../test/sample_data.ts/attributes";
import BaseWorld from "../../../test/jest/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import { createModel, deleteModel } from "../../../test/util/model_actions";
import {
    testCreateModel,
    testDeleteModel,
    testReadModel,
    testUpdateModel,
} from "../../../test/util/model_compare";
import Business, { BusinessAttributes } from "../business";
import Department, { DepartmentAttributes } from "../department";
import Permission, { PermissionAttributes } from "../permission";
import Role, { RoleAttributes } from "../role";
import User, { UserAttributes } from "../user/user";
import Manual, { ManualAttributes } from "./manual";
import ManualAssignment, {
    ManualAssignmentAttributes,
} from "./manual_assignment";

let baseWorld: BaseWorld | undefined;
const key = "manualAssignment";

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    baseWorld.setCustomProp<BusinessAttributes>(
        "businessAttributes",
        businessAttributes
    );
    baseWorld.setCustomProp<UserAttributes>("userAttributes", userAttributes);
    baseWorld.setCustomProp<PermissionAttributes>(
        "permissionAttributes",
        permissionAttributes
    );
    baseWorld.setCustomProp<DepartmentAttributes>(
        "departmentAttributes",
        departmentAttributes
    );
    baseWorld.setCustomProp<RoleAttributes>("roleAttributes", roleAttributes);
    baseWorld.setCustomProp<ManualAttributes>(
        "manualAttributes",
        manualAttributes
    );
    baseWorld.setCustomProp<ManualAssignmentAttributes>(
        "manualAssignmentAttributes",
        manualAssignmentAttributes
    );
});
afterEach(() => {
    baseWorld = undefined;
});

// Domain setup
beforeEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const business = await createModel<Business, BusinessAttributes>(
        baseWorld,
        Business,
        "business"
    );

    baseWorld.setCustomProp<UserAttributes>("userAttributes", {
        ...baseWorld.getCustomProp<UserAttributes>("userAttributes"),
        business_id: business.id,
    });

    const user = await createModel<User, UserAttributes>(
        baseWorld,
        User,
        "user"
    );

    baseWorld.setCustomProp<DepartmentAttributes>("departmentAttributes", {
        ...baseWorld.getCustomProp<DepartmentAttributes>(
            "departmentAttributes"
        ),
        business_id: business.id,
        updated_by_user_id: user.id,
    });

    const department = await createModel<Department, DepartmentAttributes>(
        baseWorld,
        Department,
        "department"
    );

    baseWorld.setCustomProp<PermissionAttributes>("permissionAttributes", {
        ...baseWorld.getCustomProp<PermissionAttributes>(
            "permissionAttributes"
        ),
        updated_by_user_id: user.id,
    });

    const permission = await createModel<Permission, PermissionAttributes>(
        baseWorld,
        Permission,
        "permission"
    );

    baseWorld.setCustomProp<RoleAttributes>("roleAttributes", {
        ...baseWorld.getCustomProp<RoleAttributes>("roleAttributes"),
        updated_by_user_id: user.id,
        permission_id: permission.id,
        department_id: department.id,
    });

    const role = await createModel<Role, RoleAttributes>(
        baseWorld,
        Role,
        "role"
    );

    baseWorld.setCustomProp<ManualAttributes>("manualAttributes", {
        ...baseWorld.getCustomProp<ManualAttributes>("manualAttributes"),
        department_id: department.id,
        role_id: role.id,
        updated_by_user_id: user.id,
    });

    const manual = await createModel<Manual, ManualAttributes>(
        baseWorld,
        Manual,
        "manual"
    );

    baseWorld.setCustomProp<ManualAssignmentAttributes>(
        "manualAssignmentAttributes",
        {
            ...baseWorld.getCustomProp<ManualAssignmentAttributes>(
                "manualAssignmentAttributes"
            ),
            department_id: department.id,
            manual_id: manual.id,
            role_id: role.id,
            updated_by_user_id: user.id,
        }
    );
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await deleteModel<Manual>(baseWorld, "manual");
    await deleteModel<Role>(baseWorld, "role");
    await deleteModel<Permission>(baseWorld, "permission");
    await deleteModel<Department>(baseWorld, "department");
    await deleteModel<User>(baseWorld, "user");
    await deleteModel<Business>(baseWorld, "business");
});

// Tests
test("Create Manual Assignment", async () => {
    await testCreateModel<ManualAssignment, ManualAssignmentAttributes>(
        baseWorld,
        ManualAssignment,
        key
    );
});

// Should fail
test("Create Manual Assignment Without Department Or Role", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    baseWorld.setCustomProp<ManualAssignmentAttributes>(
        "manualAssignmentAttributes",
        {
            ...baseWorld.getCustomProp<ManualAssignmentAttributes>(
                "manualAssignmentAttributes"
            ),
            department_id: null as any,
            role_id: null as any,
        }
    );
    try {
        await testCreateModel<ManualAssignment, ManualAssignmentAttributes>(
            baseWorld,
            ManualAssignment,
            key
        );
    } catch (e) {
        expect(e).toBeTruthy();
    }
});

/* Dont test update as it is a concatenated primary key */
/* Meaning that an update should be treated as a DELETE and INSERT */

test("Update Manual Assignment", async () => {
    await testUpdateModel<ManualAssignment, ManualAssignmentAttributes>(
        baseWorld,
        ManualAssignment,
        key,
        { role_id: null }
    );
});

test("Delete Manual Assignment", async () => {
    await testDeleteModel<ManualAssignment, ManualAssignmentAttributes>(
        baseWorld,
        ManualAssignment,
        key,
        ["id"]
    );
});

test("Read Manual Assignment", async () => {
    await testReadModel<ManualAssignment, ManualAssignmentAttributes>(
        baseWorld,
        ManualAssignment,
        key,
        ["id"]
    );
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
