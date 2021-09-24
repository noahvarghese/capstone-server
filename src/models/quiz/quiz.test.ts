/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    businessAttributes,
    departmentAttributes,
    manualAttributes,
    permissionAttributes,
    quizAttributes,
    roleAttributes,
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
import Manual, { ManualAttributes } from "../manual/manual";
import Quiz, { QuizAttributes } from "./quiz";
import ModelError from "../../../test/util/model_error";

let baseWorld: BaseWorld | undefined;
const key = "quiz";
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
    baseWorld.setCustomProp<QuizAttributes>(attrKey, quizAttributes);
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

    baseWorld.setCustomProp<QuizAttributes>(attrKey, {
        ...baseWorld.getCustomProp<QuizAttributes>(attrKey),
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
test("Create Quiz", async () => {
    await ModelTestPass.create<Quiz, QuizAttributes>(baseWorld, Quiz, key);
});

test("Update Quiz", async () => {
    await ModelTestPass.update<Quiz, QuizAttributes>(baseWorld, Quiz, key, {
        title: "TEST",
    });
});

test("Delete Quiz", async () => {
    await ModelTestPass.delete<Quiz, QuizAttributes>(baseWorld, Quiz, key, [
        "id",
    ]);
});

test("Read Quiz", async () => {
    await ModelTestPass.read<Quiz, QuizAttributes>(baseWorld, Quiz, key, [
        "id",
    ]);
});

test("Prevent Deletion of Quiz", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    // set prevent delete in environment data
    baseWorld.setCustomProp<QuizAttributes>("quizAttributes", {
        ...baseWorld.getCustomProp<QuizAttributes>("quizAttributes"),
        prevent_delete: true,
    });

    try {
        await ModelTestFail.delete(
            baseWorld,
            Quiz,
            key,
            /QuizDeleteError: Cannot delete quiz while delete lock is set/
        );

        await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, key, {
            prevent_delete: false,
        });

        await ModelActions.delete<Quiz>(baseWorld, key);
    } catch (e) {
        if (e.deleted !== undefined && e.deleted !== false) {
            await ModelActions.delete<Quiz>(baseWorld, key);
        }
    }
});

test.todo("prevent editing of quiz");

// test("Delete Question while Manual is locked doesn't work", async () => {
//     if (!baseWorld) {
//         throw new Error(BaseWorld.errorMessage);
//     }

//     await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, "quiz", {
//         prevent_edit: true,
//     });

//     try {
//         await ModelTestFail.delete<Question, QuestionAttributes>(
//             baseWorld,
//             Question,
//             key,
//             /QuestionDeleteError: Cannot delete a question while the quiz is locked from editing/
//         );

//         await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, "quiz", {
//             prevent_edit: false,
//         });

//         await ModelActions.delete<Question>(baseWorld, key);
//     } catch (e) {
//         if (e instanceof ModelError) {
//             if (e.deleted !== undefined && e.deleted !== false) {
//                 await ModelActions.delete<Question>(baseWorld, key);
//             }
//         }
//         throw e;
//     }
// });

// test("Update Question while Quiz is locked doesn't work", async () => {
//     if (!baseWorld) {
//         throw new Error(BaseWorld.errorMessage);
//     }

//     await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, "quiz", {
//         prevent_edit: true,
//     });

//     try {
//         await ModelTestFail.update<Question, QuestionAttributes>(
//             baseWorld,
//             Question,
//             key,
//             { question: "Who am i?" },
//             /QuestionUpdateError: Cannot update a question while the quiz is locked from editing/
//         );
//     } catch (e) {
//         if (
//             /QuestionDeleteError: Cannot delete a question while the quiz is locked from editing/.test(
//                 e.message
//             )
//         ) {
//             await ModelActions.update<Quiz, QuizAttributes>(baseWorld, Quiz, "quiz", {
//                 prevent_edit: false,
//             });

//             await ModelActions.delete<Question>(baseWorld, key);
//         }
//     }
// });
// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
