import Business, { BusinessAttributes } from "./business";
import BaseWorld from "../../test/jest/support/base_world";
import DBConnection from "../../test/util/db_connection";
import { businessAttributes } from "../../test/sample_data/attributes";
import ModelTestPass from "../../test/helpers/model/test/pass";
import { loadAttributes } from "../../test/helpers/model/test/setup";

// State management
let baseWorld: BaseWorld | undefined;
const key = "business";

// Database Setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, "business");
});

afterEach(() => {
    baseWorld = undefined;
});

test("Create Business", async () => {
    await ModelTestPass.create<Business, BusinessAttributes>(
        baseWorld,
        Business,
        key
    );
});

test("Update Business", async () => {
    await ModelTestPass.update<Business, BusinessAttributes>(
        baseWorld,
        Business,
        key,
        { name: "TEST" }
    );
});

test("Read Business", async () => {
    await ModelTestPass.read<Business, BusinessAttributes>(
        baseWorld,
        Business,
        key,
        ["name"]
    );
});

test("Delete Business", async () => {
    await ModelTestPass.delete<Business, BusinessAttributes>(
        baseWorld,
        Business,
        key,
        ["id"]
    );
});
