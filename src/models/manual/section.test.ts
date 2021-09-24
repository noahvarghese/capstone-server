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
import ModelActions from "../../../test/helpers/model/actions";
import ModelTestPass from "../../../test/helpers/model/test/pass";
import ModelTestFail from "../../../test/helpers/model/test/fail";
import Business, { BusinessAttributes } from "../business";
import Department, { DepartmentAttributes } from "../department";
import Permission, { PermissionAttributes } from "../permission";
import Role, { RoleAttributes } from "../role";
import User, { UserAttributes } from "../user/user";
import Manual, { ManualAttributes } from "./manual";
import ManualSection, { ManualSectionAttributes } from "./section";
import ModelError from "../../../test/util/model_error";

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

    const business = await ModelActions.create<Business, BusinessAttributes>(
        baseWorld,
        Business,
        "business"
    );

    baseWorld.setCustomProp<UserAttributes>("userAttributes", {
        ...baseWorld.getCustomProp<UserAttributes>("userAttributes"),
        business_id: business.id,
    });

    const user = await ModelActions.create<User, UserAttributes>(
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

    const department = await ModelActions.create<
        Department,
        DepartmentAttributes
    >(baseWorld, Department, "department");

    baseWorld.setCustomProp<PermissionAttributes>("permissionAttributes", {
        ...baseWorld.getCustomProp<PermissionAttributes>(
            "permissionAttributes"
        ),
        updated_by_user_id: user.id,
    });

    const permission = await ModelActions.create<
        Permission,
        PermissionAttributes
    >(baseWorld, Permission, "permission");

    baseWorld.setCustomProp<RoleAttributes>("roleAttributes", {
        ...baseWorld.getCustomProp<RoleAttributes>("roleAttributes"),
        updated_by_user_id: user.id,
        permission_id: permission.id,
        department_id: department.id,
    });

    const role = await ModelActions.create<Role, RoleAttributes>(
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

    const manual = await ModelActions.create<Manual, ManualAttributes>(
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

    await ModelActions.delete<Manual>(baseWorld, "manual");
    await ModelActions.delete<Role>(baseWorld, "role");
    await ModelActions.delete<Permission>(baseWorld, "permission");
    await ModelActions.delete<Department>(baseWorld, "department");
    await ModelActions.delete<User>(baseWorld, "user");
    await ModelActions.delete<Business>(baseWorld, "business");
});

// Tests
test("Create Section", async () => {
    await ModelTestPass.create<ManualSection, ManualSectionAttributes>(
        baseWorld,
        ManualSection,
        key
    );
});

test("Update Section", async () => {
    await ModelTestPass.update<ManualSection, ManualSectionAttributes>(
        baseWorld,
        ManualSection,
        key,
        {
            title: "TEST",
        }
    );
});

test("Delete Section", async () => {
    await ModelTestPass.delete<ManualSection, ManualSectionAttributes>(
        baseWorld,
        ManualSection,
        key,
        ["id"]
    );
});

test("Read Section", async () => {
    await ModelTestPass.read<ManualSection, ManualSectionAttributes>(
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

    await ModelActions.update<Manual, ManualAttributes>(
        baseWorld,
        Manual,
        "manual",
        {
            prevent_edit: true,
        }
    );

    try {
        await ModelTestFail.delete<ManualSection, ManualSectionAttributes>(
            baseWorld,
            ManualSection,
            key,
            /ManualSectionDeleteError: Cannot delete a section while the manual is locked from editing/
        );

        await ModelActions.update<Manual, ManualAttributes>(
            baseWorld,
            Manual,
            "manual",
            { prevent_edit: false }
        );

        await ModelActions.delete<ManualSection>(baseWorld, key);
    } catch (e) {
        if (e instanceof ModelError) {
            if (e.deleted !== undefined && e.deleted !== false) {
                await ModelActions.delete<ManualSection>(baseWorld, key);
            }
        }
        throw e;
    }
});

test("Update Section while Manual is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelActions.update<Manual, ManualAttributes>(
        baseWorld,
        Manual,
        "manual",
        {
            prevent_edit: true,
        }
    );

    try {
        await ModelTestFail.update<ManualSection, ManualSectionAttributes>(
            baseWorld,
            ManualSection,
            key,
            { title: "YOLO" },
            /ManualSectionUpdateError: Cannot update a section while the manual is locked from editing/
        );
    } catch (e) {
        if (
            /ManualSectionDeleteError: Cannot delete a section while the manual is locked from editing/.test(
                e.message
            )
        ) {
            await ModelActions.update<Manual, ManualAttributes>(
                baseWorld,
                Manual,
                "manual",
                { prevent_edit: false }
            );

            await ModelActions.delete<ManualSection>(baseWorld, key);
        }
    }
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
