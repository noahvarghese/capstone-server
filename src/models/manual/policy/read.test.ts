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
} from "../../../../test/sample_data/attributes";
import BaseWorld from "../../../../test/jest/support/base_world";
import DBConnection from "../../../../test/util/db_connection";
import ModelActions from "../../../../test/helpers/model/actions";
import ModelTestPass from "../../../../test/helpers/model/test/pass";
import Business, { BusinessAttributes } from "../../business";
import Department, { DepartmentAttributes } from "../../department";
import Permission, { PermissionAttributes } from "../../permission";
import Role, { RoleAttributes } from "../../role";
import User, { UserAttributes } from "../../user/user";
import Read, { ReadAttributes } from "./read";
import Manual, { ManualAttributes } from "../manual";
import Policy, { PolicyAttributes } from "./policy";
import Section, { ManualSectionAttributes } from "../section";

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
    baseWorld.setCustomProp<ManualSectionAttributes>(
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

    const section = await ModelActions.create<Section, ManualSectionAttributes>(
        baseWorld,
        Section,
        "section"
    );

    baseWorld.setCustomProp<PolicyAttributes>("policyAttributes", {
        ...baseWorld.getCustomProp<PolicyAttributes>("policyAttributes"),
        manual_section_id: section.id,
        updated_by_user_id: user.id,
    });

    const policy = await ModelActions.create<Policy, PolicyAttributes>(
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

    await ModelActions.delete<Policy>(baseWorld, "policy");
    await ModelActions.delete<Section>(baseWorld, "section");
    await ModelActions.delete<Manual>(baseWorld, "manual");
    await ModelActions.delete<Role>(baseWorld, "role");
    await ModelActions.delete<Permission>(baseWorld, "permission");
    await ModelActions.delete<Department>(baseWorld, "department");
    await ModelActions.delete<User>(baseWorld, "user");
    await ModelActions.delete<Business>(baseWorld, "business");
});

// Tests
test("Create Policy Read", async () => {
    await ModelTestPass.create<Read, ReadAttributes>(baseWorld, Read, key);
});

test("Update model should fail", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    try {
        await ModelTestPass.update(baseWorld, Read, key, { policy_id: 2 });
    } catch (e) {
        const errorRegex = /PolicyReadUpdateError/;
        expect(errorRegex.test(e.message)).toBe(true);
        await ModelActions.delete<Read>(baseWorld, key);
    }
});

test("Delete Policy Read", async () => {
    await ModelTestPass.delete<Read, ReadAttributes>(baseWorld, Read, key, [
        "policy_id",
        "user_id",
    ]);
});

test("Read Policy Read", async () => {
    await ModelTestPass.read<Read, ReadAttributes>(baseWorld, Read, key, [
        "user_id",
        "policy_id",
    ]);
});
