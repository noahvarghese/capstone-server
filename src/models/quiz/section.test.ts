/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    businessAttributes,
    departmentAttributes,
    manualAttributes,
    permissionAttributes,
    quizAttributes,
    quizSectionAttributes,
    roleAttributes,
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
} from "../../../test/util/model_compare";
import Business, { BusinessAttributes } from "../business";
import Department, { DepartmentAttributes } from "../department";
import Permission, { PermissionAttributes } from "../permission";
import Role, { RoleAttributes } from "../role";
import User, { UserAttributes } from "../user/user";
import Manual, { ManualAttributes } from "../manual/manual";
import Quiz, { QuizAttributes } from "./quiz";
import Section, { SectionAttributes } from "./section";

let baseWorld: BaseWorld | undefined;
const key = "section";
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

    baseWorld.setCustomProp<QuizAttributes>("quizAttributes", quizAttributes);

    baseWorld.setCustomProp<SectionAttributes>(attrKey, quizSectionAttributes);
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

    baseWorld.setCustomProp<QuizAttributes>("quizAttributes", {
        ...baseWorld.getCustomProp<QuizAttributes>("quizAttributes"),
        manual_id: manual.id,
        updated_by_user_id: user.id,
    });

    const quiz = await createModel<Quiz, QuizAttributes>(
        baseWorld,
        Quiz,
        "quiz"
    );

    baseWorld.setCustomProp<SectionAttributes>(attrKey, {
        ...baseWorld.getCustomProp<SectionAttributes>(attrKey),
        quiz_id: quiz.id,
        updated_by_user_id: user.id,
    });
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await deleteModel<Quiz>(baseWorld, "quiz");
    await deleteModel<Manual>(baseWorld, "manual");
    await deleteModel<Role>(baseWorld, "role");
    await deleteModel<Permission>(baseWorld, "permission");
    await deleteModel<Department>(baseWorld, "department");
    await deleteModel<User>(baseWorld, "user");
    await deleteModel<Business>(baseWorld, "business");
});

// Tests
test("Create Quiz Section", async () => {
    await testCreateModel<Section, SectionAttributes>(baseWorld, Section, key);
});

test("Update Quiz Section", async () => {
    await testUpdateModel<Section, SectionAttributes>(baseWorld, Section, key, {
        title: "TEST",
    });
});

test("Delete Quiz Section", async () => {
    await testDeleteModel<Section, SectionAttributes>(baseWorld, Section, key, [
        "id",
    ]);
});

test("Read Quiz Section", async () => {
    await testReadModel<Section, SectionAttributes>(baseWorld, Section, key, [
        "id",
    ]);
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
