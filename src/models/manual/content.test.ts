/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    businessAttributes,
    contentAttributes,
    departmentAttributes,
    manualAttributes,
    permissionAttributes,
    policyAttributes,
    roleAttributes,
    sectionAttributes,
    userAttributes,
} from "../../../test/sample_data.ts/attributes";
import BaseWorld from "../../../test/util/store";
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
import Content, { ContentAttributes } from "./content";
import Manual, { ManualAttributes } from "./manual";
import Policy, { PolicyAttributes } from "./policy";
import Section, { SectionAttributes } from "./section";

let baseWorld: BaseWorld | undefined;
const key = "content";
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
    baseWorld.setCustomProp<ContentAttributes>(attrKey, contentAttributes);
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

    baseWorld.setCustomProp<ContentAttributes>(attrKey, {
        ...baseWorld.getCustomProp<ContentAttributes>("contentAttributes"),
        policy_id: policy.id,
        updated_by_user_id: user.id,
    });
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await deleteModel<Policy>(baseWorld, Policy, "policy");
    await deleteModel<Section>(baseWorld, Section, "section");
    await deleteModel<Manual>(baseWorld, Manual, "manual");
    await deleteModel<Role>(baseWorld, Role, "role");
    await deleteModel<Permission>(baseWorld, Permission, "permission");
    await deleteModel<Department>(baseWorld, Department, "department");
    await deleteModel<User>(baseWorld, User, "user");
    await deleteModel<Business>(baseWorld, Business, "business");
});

// Tests
test("Create Content", async () => {
    await testCreateModel<Content, ContentAttributes>(baseWorld, Content, key);
});

test("Update Content", async () => {
    await testUpdateModel<Content, ContentAttributes>(
        baseWorld,
        Content,
        key,
        "title",
        "TEST"
    );
});

test("Delete Content", async () => {
    await testDeleteModel<Content, ContentAttributes>(baseWorld, Content, key, [
        "id",
    ]);
});

test("Read Content", async () => {
    await testReadModel<Content, ContentAttributes>(baseWorld, Content, key, [
        "id",
    ]);
});
