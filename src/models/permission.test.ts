import {
    businessAttributes,
    permissionAttributes,
    userAttributes,
} from "../../test/sample_data/attributes";
import BaseWorld from "../../test/jest/support/base_world";
import DBConnection from "../../test/util/db_connection";
import ModelActions from "../../test/helpers/model/actions";
import ModelTestPass from "../../test/helpers/model/test/pass";
import Business, { BusinessAttributes } from "./business";
import Permission, { PermissionAttributes } from "./permission";
import User, { UserAttributes } from "./user/user";

let baseWorld: BaseWorld | undefined;
const key = "permission";

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

    baseWorld.setCustomProp<PermissionAttributes>("permissionAttributes", {
        ...baseWorld.getCustomProp<PermissionAttributes>(
            "permissionAttributes"
        ),
        updated_by_user_id: user.id,
    });
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelActions.delete<User>(baseWorld, "user");
    await ModelActions.delete<Business>(baseWorld, "business");
});

// Tests
test("Create Permission", async () => {
    await ModelTestPass.create<Permission, PermissionAttributes>(
        baseWorld,
        Permission,
        key
    );
});

test("Update Permission", async () => {
    await ModelTestPass.update<Permission, PermissionAttributes>(
        baseWorld,
        Permission,
        key,
        { assign_resources_to_department: false }
    );
});

test("Delete Permission", async () => {
    await ModelTestPass.delete<Permission, PermissionAttributes>(
        baseWorld,
        Permission,
        key,
        ["id"]
    );
});

test("Read Permission", async () => {
    await ModelTestPass.read<Permission, PermissionAttributes>(
        baseWorld,
        Permission,
        key,
        ["id"]
    );
});
