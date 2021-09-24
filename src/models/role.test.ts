import {
    businessAttributes,
    departmentAttributes,
    permissionAttributes,
    roleAttributes,
    userAttributes,
} from "../../test/sample_data/attributes";
import BaseWorld from "../../test/jest/support/base_world";
import DBConnection from "../../test/util/db_connection";
import ModelActions from "../../test/helpers/model/actions";
import ModelTestPass from "../../test/helpers/model/test/pass";
import ModelTestFail from "../../test/helpers/model/test/fail";
import Business, { BusinessAttributes } from "./business";
import Department, { DepartmentAttributes } from "./department";
import Permission, { PermissionAttributes } from "./permission";
import Role, { RoleAttributes } from "./role";
import User, { UserAttributes } from "./user/user";

let baseWorld: BaseWorld | undefined;
const key = "role";

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
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelActions.delete<Permission>(baseWorld, "permission");
    await ModelActions.delete<Department>(baseWorld, "department");
    await ModelActions.delete<User>(baseWorld, "user");
    await ModelActions.delete<Business>(baseWorld, "business");
});

// Tests
test("Create Role", async () => {
    await ModelTestPass.create<Role, RoleAttributes>(baseWorld, Role, key);
});

test("Update Role", async () => {
    await ModelTestPass.update<Role, RoleAttributes>(baseWorld, Role, key, {
        name: "TEST",
    });
});

test("Delete Role", async () => {
    await ModelTestPass.delete<Role, RoleAttributes>(baseWorld, Role, key, [
        "id",
    ]);
});

test("Read Role", async () => {
    await ModelTestPass.read<Role, RoleAttributes>(baseWorld, Role, key, [
        "id",
    ]);
});

test("Prevent Deletion of Role", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    // set prevent delete in environment data
    baseWorld.setCustomProp<RoleAttributes>("roleAttributes", {
        ...baseWorld.getCustomProp<RoleAttributes>("roleAttributes"),
        prevent_delete: true,
    });

    try {
        await ModelTestFail.delete(
            baseWorld,
            Role,
            key,
            /RoleDeleteError: Cannot delete role while delete lock is set/
        );

        await ModelActions.update<Role, RoleAttributes>(baseWorld, Role, key, {
            prevent_delete: false,
        });

        await ModelActions.delete<Role>(baseWorld, key);
    } catch (e) {
        if (e.deleted !== undefined && e.deleted !== false) {
            await ModelActions.delete<Role>(baseWorld, key);
        }
    }
});
