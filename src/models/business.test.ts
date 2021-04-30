import Business, { BusinessAttributes } from "./business";
import BaseWorld from "../util/test/base_world";
import DBConnection from "../util/test/db_connection";
import { createModel, deleteModel } from "../util/test/model";

// State management
let baseWorld: BaseWorld | undefined;

// Configuration
const businessAttr: BusinessAttributes = {
    name: "Oakville Windows and Doors",
    address: "1380 Speers Rd",
    city: "Oakville",
    province: "ON",
    country: "CA",
    postal_code: "L6H 1X1",
};

const modelMatchesInterface = (
    attr: BusinessAttributes,
    model: Business
): boolean => {
    let matches = true;

    for (const key of Object.keys(attr)) {
        if (
            model[key as keyof BusinessAttributes] !==
            businessAttr[key as keyof BusinessAttributes]
        ) {
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
        throw BaseWorld.Error;
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
            throw BaseWorld.Error;
        }
        const business = await createModel<Business, BusinessAttributes>(
            baseWorld,
            Business
        );

        baseWorld.setCustomProp<Business>("model", business);
    });

    test("delete business", async () => {
        if (!baseWorld) {
            throw BaseWorld.Error;
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
        test("update business", async () => {
            if (!baseWorld) {
                throw BaseWorld.Error;
            }
        });

        test("read business", () => {
            if (!baseWorld) {
                throw BaseWorld.Error;
            }
        });

        afterEach(async () => {
            if (!baseWorld) {
                throw BaseWorld.Error;
            }
            await deleteModel(baseWorld, Business);
        });
    });
});
