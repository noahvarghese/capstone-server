import {
    businessAttributes,
    departmentAttributes,
    userAttributes,
} from "../../test/util/attributes";
import BaseWorld from "../../test/util/store";
import DBConnection from "../../test/util/db_connection";
import { createModel, deleteModel } from "../../test/util/model_actions";
import {
    testCreateModel,
    testDeleteModel,
    testReadModel,
    testUpdateModel,
} from "../../test/util/model_compare";
import Business, { BusinessAttributes } from "./business";
import Department, { DepartmentAttributes } from "./department";
import User, { UserAttributes } from "./user/user";

let baseWorld: BaseWorld | undefined;
const key = "department";

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    baseWorld.setCustomProp<UserAttributes>("userAttributes", userAttributes);
    baseWorld.setCustomProp<BusinessAttributes>(
        "businessAttributes",
        businessAttributes
    );
    baseWorld.setCustomProp<DepartmentAttributes>(
        "departmentAttributes",
        departmentAttributes
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
        updated_by_user_id: user.id,
        business_id: business.id,
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
test("Create Department", async () => {
    await testCreateModel<Department, DepartmentAttributes>(
        baseWorld,
        Department,
        key
    );
});

test("Update Department", async () => {
    await testUpdateModel<Department, DepartmentAttributes>(
        baseWorld,
        Department,
        key,
        "name",
        "TEST"
    );
});

test("Delete Department", async () => {
    await testDeleteModel<Department, DepartmentAttributes>(
        baseWorld,
        Department,
        key,
        ["id"]
    );
});

test("Read Department", async () => {
    await testReadModel<Department, DepartmentAttributes>(
        baseWorld,
        Department,
        key,
        ["id"]
    );
});
