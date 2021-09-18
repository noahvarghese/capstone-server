/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    businessAttributes,
    departmentAttributes,
    manualAttributes,
    permissionAttributes,
    policyAttributes,
    readAttributes,
    roleAttributes,
    sectionAttributes,
    userAttributes,
} from "../../../test/sample_data/attributes";
import BaseWorld from "../../../test/jest/support/base_world";
import DBConnection from "../../../test/util/db_connection";
import { createModel, deleteModel } from "../../../test/util/model_actions";
import {
    testCreateModel,
    testDeleteModel,
    testReadModel,
    testUpdateModel,
    testUpdateModelFail,
    testUpdateModelV2,
    // testUpdateModelFail,
} from "../../../test/util/model_compare";
import Business, { BusinessAttributes } from "../business";
import Department, { DepartmentAttributes } from "../department";
import Permission, { PermissionAttributes } from "../permission";
import Role, { RoleAttributes } from "../role";
import User, { UserAttributes } from "../user/user";
import Read, { ReadAttributes } from "./read";
import Manual, { ManualAttributes } from "./manual";
import Policy, { PolicyAttributes } from "./policy";
import Section, { SectionAttributes } from "./section";

let baseWorld: BaseWorld | undefined;
const key = "read";
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
    baseWorld.setCustomProp<SectionAttributes>(
        "sectionAttributes",
        sectionAttributes
    );
    baseWorld.setCustomProp<PolicyAttributes>(
        "policyAttributes",
        policyAttributes
    );
    baseWorld.setCustomProp<ReadAttributes>(attrKey, readAttributes);
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

    baseWorld.setCustomProp<SectionAttributes>("sectionAttributes", {
        ...baseWorld.getCustomProp<SectionAttributes>("sectionAttributes"),
        manual_id: manual.id,
        updated_by_user_id: user.id,
    });

    const section = await createModel<Section, SectionAttributes>(
        baseWorld,
        Section,
        "section"
    );

    baseWorld.setCustomProp<PolicyAttributes>("policyAttributes", {
        ...baseWorld.getCustomProp<PolicyAttributes>("policyAttributes"),
        section_id: section.id,
        updated_by_user_id: user.id,
    });

    const policy = await createModel<Policy, PolicyAttributes>(
        baseWorld,
        Policy,
        "policy"
    );

    baseWorld.setCustomProp<ReadAttributes>(attrKey, {
        ...baseWorld.getCustomProp<ReadAttributes>(attrKey),
        policy_id: policy.id,
        user_id: user.id,
    });
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await deleteModel<Policy>(baseWorld, "policy");
    await deleteModel<Section>(baseWorld, "section");
    await deleteModel<Manual>(baseWorld, "manual");
    await deleteModel<Role>(baseWorld, "role");
    await deleteModel<Permission>(baseWorld, "permission");
    await deleteModel<Department>(baseWorld, "department");
    await deleteModel<User>(baseWorld, "user");
    await deleteModel<Business>(baseWorld, "business");
});

// Tests
test("Create Policy Read", async () => {
    await testCreateModel<Read, ReadAttributes>(baseWorld, Read, key);
});

test("Update model should fail", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    try {
        await testUpdateModel(baseWorld, Read, key, { policy_id: 2 });
    } catch (e) {
        const errorRegex = /PolicyReadUpdateError/;
        expect(errorRegex.test(e.message)).toBe(true);
        await deleteModel<Read>(baseWorld, key);
    }
});

test("Delete Policy Read", async () => {
    await testDeleteModel<Read, ReadAttributes>(baseWorld, Read, key, [
        "policy_id",
        "user_id",
    ]);
});

test("Read Policy Read", async () => {
    await testReadModel<Read, ReadAttributes>(baseWorld, Read, key, [
        "user_id",
        "policy_id",
    ]);
});
