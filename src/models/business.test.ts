import Business, { BusinessAttributes } from "./business";
import BaseWorld from "../util/test/base_world";
import DBConnection from "../util/test/db_connection";
import {
    createModel,
    deleteModel,
    modelMatchesInterface,
} from "../util/test/model";

// State management
let baseWorld: BaseWorld | undefined;

// Configuration
export const businessAttr: BusinessAttributes = {
    name: "Oakville Windows and Doors",
    address: "1380 Speers Rd",
    city: "Oakville",
    province: "ON",
    country: "CA",
    postal_code: "L6H1X1",
};

beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    baseWorld.setCustomProp<BusinessAttributes>("attributes", businessAttr);
});

afterEach(() => {
    baseWorld = undefined;
});

test("Create business", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const business = await createModel<Business, BusinessAttributes>(
        baseWorld,
        Business
    );

    expect(business.id).toBeGreaterThan(0);
    expect(modelMatchesInterface(businessAttr, business)).toBe(true);

    // Cleanup
    await deleteModel(baseWorld, Business);
});

describe("Business tests that require a preexisting business", () => {
    beforeEach(async () => {
        if (!baseWorld) {
            throw new Error(BaseWorld.errorMessage);
        }

        await createModel<Business, BusinessAttributes>(baseWorld, Business);
    });

    test("delete business", async () => {
        if (!baseWorld) {
            throw new Error(BaseWorld.errorMessage);
        }

        await deleteModel(baseWorld, Business);

        const { connection } = baseWorld;
        const model = baseWorld.getCustomProp<Business>("model");

        const business = await connection.manager.find(Business, {
            where: { id: model.id },
        });

        expect(business.length).toBe(0);
    });

    describe("business tests that require the business to be deleted", () => {
        afterEach(async () => {
            if (!baseWorld) {
                throw new Error(BaseWorld.errorMessage);
            }
            await deleteModel(baseWorld, Business);
        });

        test("read business", async () => {
            if (!baseWorld) {
                throw new Error(BaseWorld.errorMessage);
            }
            const { connection } = baseWorld;

            const business = await connection.manager.find(Business, {
                where: { name: businessAttr.name },
            });

            expect(business.length).toBe(1);
            expect(modelMatchesInterface(businessAttr, business[0])).toBe(true);
        });

        test("update business", async () => {
            if (!baseWorld) {
                throw new Error(BaseWorld.errorMessage);
            }

            const { connection } = baseWorld;
            let business = baseWorld.getCustomProp<Business>("model");

            business.name = "TEST";
            businessAttr.name = "TEST";

            business = await connection.manager.save(business);

            expect(modelMatchesInterface(businessAttr, business)).toBe(true);
        });
    });
});
