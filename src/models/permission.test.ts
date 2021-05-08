import {
    businessAttributes,
    permissionAttributes,
    userAttributes,
} from "../../test/util/attributes";
import BaseWorld from "../../test/util/base_world";
import DBConnection from "../../test/util/db_connection";
import { createModel, deleteModel } from "../../test/util/model_actions";
import {
    testCreateModel,
    testDeleteModel,
    testReadModel,
    testUpdateModel,
} from "../../test/util/model_compare";
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

    await deleteModel<User>(baseWorld, User, "user");
    await deleteModel<Business>(baseWorld, Business, "business");
});

// Tests
test("Create Permission", async () => {
    await testCreateModel<Permission, PermissionAttributes>(
        baseWorld,
        Permission,
        key
    );
});

test("Update Permission", async () => {
    await testUpdateModel<Permission, PermissionAttributes>(
        baseWorld,
        Permission,
        key,
        "edit_policies",
        false
    );
});

test("Delete Permission", async () => {
    await testDeleteModel<Permission, PermissionAttributes>(
        baseWorld,
        Permission,
        key,
        ["id"]
    );
});

test("Read Permission", async () => {
    await testReadModel<Permission, PermissionAttributes>(
        baseWorld,
        Permission,
        key,
        ["id"]
    );
});
