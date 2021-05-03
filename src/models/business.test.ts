import Business, { BusinessAttributes } from "./business";
import BaseWorld from "../util/test/base_world";
import DBConnection from "../util/test/db_connection";
import { createModel, deleteModel } from "../util/test/model";
import Logs from "../util/logs/logs";
import BaseModel from "./abstract/base_model";

// State management
let baseWorld: BaseWorld | undefined;

// Configuration
const businessAttr: BusinessAttributes = {
    name: "Oakville Windows and Doors",
    address: "1380 Speers Rd",
    city: "Oakville",
    province: "ON",
    country: "CA",
    postal_code: "L6H1X1",
};

const modelMatchesInterface = <T, X extends T>(attr: T, model: X): boolean => {
    let matches = true;

    for (const key of Object.keys(attr)) {
        const modelVal = model[key as keyof X];
        const attrVal = attr[key as keyof T];

        if ((modelVal as any) !== (attrVal as any)) {
            Logs.Test(modelVal);
            Logs.Test(attrVal);
            matches = false;
            break;
        }
    }

    return matches;
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
