import Business, { BusinessAttributes } from "./business";
import BaseWorld from "../../test/support/base_world";
import DBConnection from "../../test/util/db_connection";
import ModelTestPass from "../../test/jest/helpers/model/test/pass";
import { loadAttributes } from "../../test/jest/helpers/model/test/setup";

// State management
let baseWorld: BaseWorld | undefined;

// Database Setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, Business);
});

afterEach(() => {
    baseWorld = undefined;
});

test("Create Business", async () => {
    await ModelTestPass.create<Business, BusinessAttributes>(
        baseWorld,
        Business
    );
});

test("Update Business", async () => {
    await ModelTestPass.update<Business, BusinessAttributes>(
        baseWorld,
        Business,
        { name: "TEST" }
    );
});

test("Read Business", async () => {
    await ModelTestPass.read<Business, BusinessAttributes>(
        baseWorld,
        Business,
        ["name"]
    );
});

test("Delete Business", async () => {
    await ModelTestPass.delete<Business, BusinessAttributes>(
        baseWorld,
        Business,
        ["id"]
    );
});
