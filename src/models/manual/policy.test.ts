/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    businessAttributes,
    departmentAttributes,
    manualAttributes,
    permissionAttributes,
    policyAttributes,
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
import Policy, { PolicyAttributes } from "./policy";
import Section, { ManualSectionAttributes } from "./manual_section";
import ModelError from "../../../test/util/ModelError";
import Content, { ContentAttributes } from "./content";

let baseWorld: BaseWorld | undefined;
const key = "policy";
const attrKey = `${key}Attributes`;

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
    baseWorld.setCustomProp<PolicyAttributes>(attrKey, policyAttributes);
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

    const section = await createModel<Section, ManualSectionAttributes>(
        baseWorld,
        Section,
        "section"
    );

    baseWorld.setCustomProp<PolicyAttributes>(attrKey, {
        ...baseWorld.getCustomProp<PolicyAttributes>(attrKey),
        manual_section_id: section.id,
        updated_by_user_id: user.id,
    });
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await deleteModel<Section>(baseWorld, "section");
    await deleteModel<Manual>(baseWorld, "manual");
    await deleteModel<Role>(baseWorld, "role");
    await deleteModel<Permission>(baseWorld, "permission");
    await deleteModel<Department>(baseWorld, "department");
    await deleteModel<User>(baseWorld, "user");
    await deleteModel<Business>(baseWorld, "business");
});

// Tests
test("Create Policy", async () => {
    await testCreateModel<Policy, PolicyAttributes>(baseWorld, Policy, key);
});

test("Update Policy", async () => {
    await testUpdateModel<Policy, PolicyAttributes>(baseWorld, Policy, key, {
        title: "TEST",
    });
});

test("Delete Policy", async () => {
    await testDeleteModel<Policy, PolicyAttributes>(baseWorld, Policy, key, [
        "id",
    ]);
});

test("Read Policy", async () => {
    await testReadModel<Policy, PolicyAttributes>(baseWorld, Policy, key, [
        "id",
    ]);
});

test("Delete Policy while Manual is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await updateModel<Manual, ManualAttributes>(baseWorld, Manual, "manual", {
        prevent_edit: true,
    });

    try {
        await testDeleteModelFail<Policy, PolicyAttributes>(
            baseWorld,
            Policy,
            key,
            /PolicyDeleteError: Cannot delete a policy while the manual is locked from editing/
        );

        await updateModel<Manual, ManualAttributes>(
            baseWorld,
            Manual,
            "manual",
            { prevent_edit: false }
        );

        await deleteModel<Policy>(baseWorld, key);
    } catch (e) {
        if (e instanceof ModelError) {
            if (e.deleted !== undefined && e.deleted !== false) {
                await deleteModel<Policy>(baseWorld, key);
            }
        }
        throw e;
    }
});

test("Update Policy while Manual is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await updateModel<Manual, ManualAttributes>(baseWorld, Manual, "manual", {
        prevent_edit: true,
    });

    try {
        await testUpdateModelFail<Policy, PolicyAttributes>(
            baseWorld,
            Policy,
            key,
            { title: "YOLO" },
            /PolicyUpdateError: Cannot update a policy while the manual is locked from editing/
        );
    } catch (e) {
        if (
            /PolicyDeleteError: Cannot delete a policy while the manual is locked from editing/.test(
                e.message
            )
        ) {
            await updateModel<Manual, ManualAttributes>(
                baseWorld,
                Manual,
                "manual",
                { prevent_edit: false }
            );

            await deleteModel<Policy>(baseWorld, key);
        }
    }
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
