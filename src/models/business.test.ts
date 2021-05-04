import Business, { BusinessAttributes } from "./business";
import BaseWorld from "../util/test/base_world";
import DBConnection from "../util/test/db_connection";
import { businessAttributes } from "../util/test/attributes";
import {
    testCreateModel,
    testUpdateModel,
    testDeleteModel,
    testReadModel,
} from "../util/test/model_compare";

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
        "name",
        "TEST"
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
