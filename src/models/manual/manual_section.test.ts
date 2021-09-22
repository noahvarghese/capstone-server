/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    businessAttributes,
    departmentAttributes,
    manualAttributes,
    permissionAttributes,
    roleAttributes,
    sectionAttributes,
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
import ManualSection, { ManualSectionAttributes } from "./manual_section";
import ModelError from "../../../test/util/ModelError";

let baseWorld: BaseWorld | undefined;
const key = "section";

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
    baseWorld.setCustomProp<ManualSectionAttributes>(
        "sectionAttributes",
        sectionAttributes
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

    baseWorld.setCustomProp<ManualSectionAttributes>("sectionAttributes", {
        ...baseWorld.getCustomProp<ManualSectionAttributes>(
            "sectionAttributes"
        ),
        manual_id: manual.id,
        updated_by_user_id: user.id,
    });
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
test("Create Section", async () => {
    await testCreateModel<ManualSection, ManualSectionAttributes>(
        baseWorld,
        ManualSection,
        key
    );
});

test("Update Section", async () => {
    await testUpdateModel<ManualSection, ManualSectionAttributes>(
        baseWorld,
        ManualSection,
        key,
        {
            title: "TEST",
        }
    );
});

test("Delete Section", async () => {
    await testDeleteModel<ManualSection, ManualSectionAttributes>(
        baseWorld,
        ManualSection,
        key,
        ["id"]
    );
});

test("Read Section", async () => {
    await testReadModel<ManualSection, ManualSectionAttributes>(
        baseWorld,
        ManualSection,
        key,
        ["id"]
    );
});

test("Delete Section while Manual is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await updateModel<Manual, ManualAttributes>(baseWorld, Manual, "manual", {
        prevent_edit: true,
    });

    try {
        await testDeleteModelFail<ManualSection, ManualSectionAttributes>(
            baseWorld,
            ManualSection,
            key,
            /ManualSectionDeleteError: Cannot delete a section while the manual is locked from editing/
        );

        await updateModel<Manual, ManualAttributes>(
            baseWorld,
            Manual,
            "manual",
            { prevent_edit: false }
        );

        await deleteModel<ManualSection>(baseWorld, key);
    } catch (e) {
        console.log(e);
        if (e instanceof ModelError) {
            if (e.deleted !== undefined && e.deleted !== false) {
                await deleteModel<ManualSection>(baseWorld, key);
            }
        }
        throw e;
    }
});

test("Update Section while Manual is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await updateModel<Manual, ManualAttributes>(baseWorld, Manual, "manual", {
        prevent_edit: true,
    });

    try {
        await testUpdateModelFail<ManualSection, ManualSectionAttributes>(
            baseWorld,
            ManualSection,
            key,
            { title: "YOLO" },
            /ManualSectionUpdateError: Cannot update a section while the manual is locked from editing/
        );
    } catch (e) {
        if (e instanceof ModelError) {
            if (e.deleted !== undefined && e.deleted !== false) {
                await deleteModel<ManualSection>(baseWorld, key);
            }
        } else if (
            /ManualSectionDeleteError: Cannot delete a section while the manual is locked from editing/.test(
                e.message
            )
        ) {
            await updateModel<Manual, ManualAttributes>(
                baseWorld,
                Manual,
                "manual",
                { prevent_edit: false }
            );

            await deleteModel<ManualSection>(baseWorld, key);
        }
    }
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
