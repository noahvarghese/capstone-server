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

import ModelActions from "../../../test/helpers/model/actions";
import ModelTestPass from "../../../test/helpers/model/test/pass";
import ModelTestParentPrevent from "../../../test/helpers/model/test/parent_prevent";
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

    baseWorld.setCustomProp<QuizAttributes>("quizAttributes", {
        ...baseWorld.getCustomProp<QuizAttributes>("quizAttributes"),
        manual_id: manual.id,
        updated_by_user_id: user.id,
    });

    const quiz = await ModelActions.create<Quiz, QuizAttributes>(
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

    await ModelActions.delete<Quiz>(baseWorld, "quiz");
    await ModelActions.delete<Manual>(baseWorld, "manual");
    await ModelActions.delete<Role>(baseWorld, "role");
    await ModelActions.delete<Permission>(baseWorld, "permission");
    await ModelActions.delete<Department>(baseWorld, "department");
    await ModelActions.delete<User>(baseWorld, "user");
    await ModelActions.delete<Business>(baseWorld, "business");
});

// Tests
test("Create Quiz Section", async () => {
    await ModelTestPass.create<Section, SectionAttributes>(
        baseWorld,
        Section,
        key
    );
});

test("Update Quiz Section", async () => {
    await ModelTestPass.update<Section, SectionAttributes>(
        baseWorld,
        Section,
        key,
        {
            title: "TEST",
        }
    );
});

test("Delete Quiz Section", async () => {
    await ModelTestPass.delete<Section, SectionAttributes>(
        baseWorld,
        Section,
        key,
        ["id"]
    );
});

test("Read Quiz Section", async () => {
    await ModelTestPass.read<Section, SectionAttributes>(
        baseWorld,
        Section,
        key,
        ["id"]
    );
});

test("Delete Question while Manual is locked doesn't work", async () => {
    await ModelTestParentPrevent.delete<
        Quiz,
        QuizAttributes,
        Section,
        SectionAttributes
    >(
        baseWorld,
        { type: Quiz, modelName: "quiz", toggleAttribute: "prevent_edit" },
        { type: Section, modelName: key },
        /QuizSectionDeleteError: Cannot delete a section while the quiz is locked from editing/
    );
});

test("Update Question while Quiz is locked doesn't work", async () => {
    await ModelTestParentPrevent.update<
        Quiz,
        QuizAttributes,
        Section,
        SectionAttributes
    >(
        baseWorld,
        { type: Quiz, modelName: "quiz", toggleAttribute: "prevent_edit" },
        {
            type: Section,
            modelName: key,
            attributesToUpdate: { title: "YOLO" },
        },
        /QuizSectionUpdateError: Cannot update a section while the quiz is locked from editing/
    );
});
// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
