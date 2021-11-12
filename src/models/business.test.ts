import Business, { BusinessAttributes } from "./business";
import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/model/helpers/test/pass";
import Model from "@test/model/helpers";

// State management
let baseWorld: BaseWorld | undefined;

// Database Setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    Model.loadAttributes.call(baseWorld, Business);
});

afterEach(() => {
    baseWorld?.resetProps();
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
