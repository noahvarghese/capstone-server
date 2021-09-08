import {
    businessAttributes,
    eventAttributes,
    userAttributes,
} from "../../test/sample_data/attributes";
import DBConnection from "../../test/util/db_connection";
import { createModel, deleteModel } from "../../test/util/model_actions";
import {
    testCreateModel,
    testCreateModelFail,
    testDeleteModel,
    testReadModel,
    testUpdateModelFail,
} from "../../test/util/model_compare";
import BaseWorld from "../../test/jest/support/base_world";
import Business, { BusinessAttributes } from "./business";
import Event, { EventAttributes } from "./event";
import User, { UserAttributes } from "./user/user";

let baseWorld: BaseWorld | undefined;
const key = "event";

beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());

    baseWorld.setCustomProp<BusinessAttributes>(
        "businessAttributes",
        businessAttributes
    );

    baseWorld.setCustomProp<UserAttributes>("userAttributes", userAttributes);

    baseWorld.setCustomProp<EventAttributes>(
        "eventAttributes",
        eventAttributes
    );
});

afterEach(() => {
    baseWorld = undefined;
});

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

    const user = await createModel<User, UserAttributes>(
        baseWorld,
        User,
        "user"
    );

    baseWorld.setCustomProp<EventAttributes>("eventAttributes", {
        ...baseWorld.getCustomProp<EventAttributes>("eventAttributes"),
        user_id: user.id,
    });
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await deleteModel<User>(baseWorld, "user");
    await deleteModel<Business>(baseWorld, "business");
});

test("Create Event", async () => {
    await testCreateModel<Event, EventAttributes>(baseWorld, Event, key);
});

test("Create Event without user_id or business_id", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const eventAttrs =
        baseWorld.getCustomProp<EventAttributes>("eventAttrbutes");
    eventAttrs.business_id = null;
    eventAttrs.user_id = null;
    baseWorld?.setCustomProp<EventAttributes>("eventAttributes", eventAttrs);

    await testCreateModelFail<Event, EventAttributes>(baseWorld, Event, key);
});

test("Update Event should fail", async () => {
    await testUpdateModelFail<Event, EventAttributes>(baseWorld, Event, key, {
        status: "PASS",
    });
});

test("Delete Event", async () => {
    jest.setTimeout(10000);
    await testDeleteModel<Event, EventAttributes>(baseWorld, Event, key, [
        "id",
    ]);
});

test("Read Event", async () => {
    jest.setTimeout(10000);
    await testReadModel<Event, EventAttributes>(baseWorld, Event, key, ["id"]);
});
