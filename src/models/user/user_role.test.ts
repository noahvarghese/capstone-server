import {
    businessAttributes,
    departmentAttributes,
    permissionAttributes,
    roleAttributes,
    userAttributes,
    userRoleAttributes,
} from "../../../test/util/attributes";
import BaseWorld from "../../../test/util/store";
import DBConnection from "../../../test/util/db_connection";
import { createModel, deleteModel } from "../../../test/util/model_actions";
import {
    testCreateModel,
    testDeleteModel,
    testReadModel,
} from "../../../test/util/model_compare";
import Business, { BusinessAttributes } from "../business";
import Department, { DepartmentAttributes } from "../department";
import Permission, { PermissionAttributes } from "../permission";
import Role, { RoleAttributes } from "../role";
import User, { UserAttributes } from "../user/user";
import UserRole, { UserRoleAttributes } from "./user_role";

let baseWorld: BaseWorld | undefined;
const key = "userRole";

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
    baseWorld.setCustomProp<UserRoleAttributes>(
        "userRoleAttributes",
        userRoleAttributes
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

    baseWorld.setCustomProp<UserRoleAttributes>("userRoleAttributes", {
        ...baseWorld.getCustomProp<UserRoleAttributes>("userRoleAttributes"),
        user_id: user.id,
        role_id: role.id,
        updated_by_user_id: user.id,
    });
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await deleteModel<Role>(baseWorld, Role, "role");
    await deleteModel<Permission>(baseWorld, Permission, "permission");
    await deleteModel<Department>(baseWorld, Department, "department");
    await deleteModel<User>(baseWorld, User, "user");
    await deleteModel<Business>(baseWorld, Business, "business");
});

// Tests
test("Create User Role", async () => {
    await testCreateModel<UserRole, UserRoleAttributes>(
        baseWorld,
        UserRole,
        key
    );
});

/* Dont test update as it is a concatenated primary key */
/* Meaning that an update should be treated as a DELETE and INSERT */

// test("Update User Role", async () => {
//     await testUpdateModel<UserRole, UserRoleAttributes>(
//         baseWorld,
//         UserRole,
//         key,
//         "name",
//         "TEST"
//     );
// });

test("Delete User Role", async () => {
    await testDeleteModel<UserRole, UserRoleAttributes>(
        baseWorld,
        UserRole,
        key,
        ["user_id", "role_id"]
    );
});

test("Read User Role", async () => {
    await testReadModel<UserRole, UserRoleAttributes>(
        baseWorld,
        UserRole,
        key,
        ["user_id", "role_id"]
    );
});

// May want to add a trigger to not allow last updated by user to be the same as the user this role applies to
