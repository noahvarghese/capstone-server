/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    businessAttributes,
    departmentAttributes,
    manualAttributes,
    permissionAttributes,
    roleAttributes,
    userAttributes,
} from "../../../test/sample_data/attributes";
import BaseWorld from "../../../test/jest/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import {
    createModel,
    deleteModel,
    updateModel,
} from "../../../test/util/model_actions";
import {
    testCreateModel,
    testCreateModelFail,
    testDeleteModel,
    testDeleteModelFail,
    testReadModel,
    testUpdateModel,
    testUpdateModelFail,
} from "../../../test/util/model_compare";
import Business, { BusinessAttributes } from "../business";
import Department, { DepartmentAttributes } from "../department";
import Permission, { PermissionAttributes } from "../permission";
import Role, { RoleAttributes } from "../role";
import User, { UserAttributes } from "../user/user";
import Manual, { ManualAttributes } from "./manual";

let baseWorld: BaseWorld | undefined;
const key = "manual";

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
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await deleteModel<Role>(baseWorld, "role");
    await deleteModel<Permission>(baseWorld, "permission");
    await deleteModel<Department>(baseWorld, "department");
    await deleteModel<User>(baseWorld, "user");
    await deleteModel<Business>(baseWorld, "business");
});

// Tests
test("Create Manual", async () => {
    await testCreateModel<Manual, ManualAttributes>(baseWorld, Manual, key);
});

// Should fail
test("Create Manual Without Department Or Role", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    baseWorld.setCustomProp<ManualAttributes>("manualAttributes", {
        ...baseWorld.getCustomProp<ManualAttributes>("manualAttributes"),
        department_id: null as any,
        role_id: null as any,
    });

    await testCreateModelFail(
        baseWorld,
        Manual,
        key,
        /ManualInsertError: Trying to add a manual without a role or department/
    );
});

test("Update Manual Without Department Or Role", async () => {
    await testUpdateModelFail<Manual, ManualAttributes>(
        baseWorld,
        Manual,
        key,
        {
            role_id: null,
            department_id: null,
        },
        /ManualUpdateError: Trying to update a manual without a role and department/
    );
});

/* Dont test update as it is a concatenated primary key */
/* Meaning that an update should be treated as a DELETE and INSERT */

test("Update Manual", async () => {
    await testUpdateModel<Manual, ManualAttributes>(baseWorld, Manual, key, {
        title: "TEST",
    });
});

test("Delete Manual", async () => {
    await testDeleteModel<Manual, ManualAttributes>(baseWorld, Manual, key, [
        "id",
    ]);
});

test("Read User Role", async () => {
    await testReadModel<Manual, ManualAttributes>(baseWorld, Manual, key, [
        "id",
    ]);
});

test("Prevent Deletion of Manual", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    // set prevent delete in environment data
    baseWorld.setCustomProp<ManualAttributes>("manualAttributes", {
        ...baseWorld.getCustomProp<ManualAttributes>("manualAttributes"),
        prevent_delete: true,
    });

    try {
        await testDeleteModelFail(
            baseWorld,
            Manual,
            key,
            /ManualDeleteError: Cannot delete manual while delete lock is set/
        );

        await updateModel<Manual, ManualAttributes>(baseWorld, Manual, key, {
            prevent_delete: false,
        });

        await deleteModel<Manual>(baseWorld, key);
    } catch (e) {
        if (e.deleted !== undefined && e.deleted !== false) {
            await deleteModel<Manual>(baseWorld, key);
        }
    }
});

test("Prevent edit of manual", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    // set prevent delete in environment data
    baseWorld.setCustomProp<ManualAttributes>("manualAttributes", {
        ...baseWorld.getCustomProp<ManualAttributes>("manualAttributes"),
        prevent_edit: true,
    });

    await testUpdateModelFail<Manual, ManualAttributes>(
        baseWorld,
        Manual,
        key,
        {
            title: "YOLO",
        },
        /ManualUpdateError: Manual is locked from editing./
    );
});
// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
