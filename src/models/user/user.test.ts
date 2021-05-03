import BaseWorld from "../../util/test/base_world";
import DBConnection from "../../util/test/db_connection";
import {
    createModel,
    deleteModel,
    modelMatchesInterface,
} from "../../util/test/model";
import Business, { BusinessAttributes } from "../business";
import { businessAttr } from "../business.test";
import User, { UserAttributes } from "./user";

let baseWorld: BaseWorld | undefined;

let business: Business;

const attributes: UserAttributes = {
    first_name: "Noah",
    last_name: "Varghese",
    email: "varghese.noah@gmail.com",
    password: "password",
    address: "207 Elderwood Trail",
    city: "Oakville",
    postal_code: "L6H1X1",
    province: "ON",
    country: "CA",
    birthday: new Date("1996-08-07"),
    original_phone: "647 771 5777",
    phone: 6477715777,
    business_id: -1,
};

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    baseWorld.setCustomProp<UserAttributes>("attributes", attributes);
});
afterEach(() => {
    baseWorld = undefined;
});

// Business Setup
beforeEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    business = await createModel<Business, BusinessAttributes>(
        baseWorld,
        Business,
        false,
        businessAttr
    );

    attributes.business_id = business.id;
    baseWorld.setCustomProp<UserAttributes>("attributes", attributes);
});
afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    deleteModel<Business>(baseWorld, Business, business);
});

// Tests

test("Create User", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    const user = await createModel<User, UserAttributes>(baseWorld, User);

    expect(user.id).toBeGreaterThan(0);
    expect(modelMatchesInterface(attributes, user)).toBe(true);

    await deleteModel(baseWorld, User);
});

test("Update User", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;

    let user = await createModel<User, UserAttributes>(baseWorld, User);
    user.first_name = "TEST";
    attributes.first_name = "TEST";

    baseWorld.setCustomProp<UserAttributes>("attributes", attributes);
    user = await connection.manager.save(user);

    expect(modelMatchesInterface(attributes, user)).toBe(true);

    await deleteModel(baseWorld, User);
});

test("Delete User", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;

    const user = await createModel<User, UserAttributes>(baseWorld, User);

    await deleteModel(baseWorld, user);

    const result = await connection.manager.find(User, {
        where: { id: user.id },
    });

    expect(result.length).toBe(0);
});

test("Read User", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;

    const user = await createModel<User, UserAttributes>(baseWorld, User);

    const foundUsers = await connection.manager.find(User, {
        where: { id: user.id },
    });

    expect(foundUsers.length).toBe(1);
    expect(modelMatchesInterface(user, foundUsers[0]));

    await deleteModel(baseWorld, User);
});
