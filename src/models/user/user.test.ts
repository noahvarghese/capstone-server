import BaseWorld from "../../util/test/base_world";
import DBConnection from "../../util/test/db_connection";
import { createModel, deleteModel } from "../../util/test/model_actions";
import Business, { BusinessAttributes } from "../business";
import { businessAttributes, userAttributes } from "../../util/test/attributes";
import User, { UserAttributes } from "./user";
import {
    testCreateModel,
    testDeleteModel,
    testReadModel,
    testUpdateModel,
} from "../../util/test/model_compare";

let baseWorld: BaseWorld | undefined;
const key = "user";

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
});
afterEach(() => {
    baseWorld = undefined;
});

// Business Setup
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
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await deleteModel<Business>(baseWorld, Business, "business");
});

// Tests

test("Create User", async () => {
    await testCreateModel<User, UserAttributes>(baseWorld, User, key);
});

test("Update User", async () => {
    await testUpdateModel<User, UserAttributes>(
        baseWorld,
        User,
        key,
        "name",
        "TEST"
    );
});

test("Delete User", async () => {
    await testDeleteModel<User, UserAttributes>(baseWorld, User, key, "id");
});

test("Read User", async () => {
    await testReadModel<User, UserAttributes>(baseWorld, User, key, "email");
});
