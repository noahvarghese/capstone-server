import Business, { BusinessAttributes } from "./business";
import BaseWorld from "../../test/jest/support/base_world";
import DBConnection from "../../test/util/db_connection";
import { businessAttributes } from "../../test/sample_data.ts/attributes";
import {
    testCreateModel,
    testUpdateModel,
    testDeleteModel,
    testReadModel,
} from "../../test/util/model_compare";

// State management
let baseWorld: BaseWorld | undefined;
const key = "business";

// Database Setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    baseWorld.setCustomProp<BusinessAttributes>(
        `${key}Attributes`,
        businessAttributes
    );
});

afterEach(() => {
    baseWorld = undefined;
});

// Tests

test("Create Business", async () => {
    await testCreateModel<Business, BusinessAttributes>(
        baseWorld,
        Business,
        key
    );
});

test("Update Business", async () => {
    await testUpdateModel<Business, BusinessAttributes>(
        baseWorld,
        Business,
        key,
        { name: "TEST" }
    );
});

test("Read Business", async () => {
    await testReadModel<Business, BusinessAttributes>(
        baseWorld,
        Business,
        key,
        ["name"]
    );
});

test("Delete Business", async () => {
    await testDeleteModel<Business, BusinessAttributes>(
        baseWorld,
        Business,
        key,
        ["id"]
    );
});
