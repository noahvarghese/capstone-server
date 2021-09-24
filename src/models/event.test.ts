import {
    businessAttributes,
    eventAttributes,
    userAttributes,
} from "../../test/sample_data/attributes";
import DBConnection from "../../test/util/db_connection";
import ModelActions from "../../test/helpers/model/actions";
import ModelTestPass from "../../test/helpers/model/test/pass";
import ModelTestFail from "../../test/helpers/model/test/fail";
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

    const business = await ModelActions.create<Business, BusinessAttributes>(
        baseWorld,
        Business,
        "business"
    );

    baseWorld.setCustomProp<UserAttributes>("userAttributes", {
        ...baseWorld.getCustomProp<UserAttributes>("userAttributes"),
        business_id: business.id,
    });

    const user = await ModelActions.create<User, UserAttributes>(
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

    await ModelActions.delete<User>(baseWorld, "user");
    await ModelActions.delete<Business>(baseWorld, "business");
});

test("Create Event", async () => {
    await ModelTestPass.create<Event, EventAttributes>(baseWorld, Event, key);
});

test("Create Event without user_id or business_id", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const eventAttrs =
        baseWorld.getCustomProp<EventAttributes>("eventAttributes");
    eventAttrs.business_id = null;
    eventAttrs.user_id = null;
    baseWorld?.setCustomProp<EventAttributes>("eventAttributes", eventAttrs);

    await ModelTestFail.create<Event, EventAttributes>(
        baseWorld,
        Event,
        key,
        /EventInsertError: Must have either business_id or user_id/
    );
});

test("Update Event should fail", async () => {
    await ModelTestFail.update<Event, EventAttributes>(
        baseWorld,
        Event,
        key,
        {
            status: "PASS",
        },
        /EventUpdateError: Cannot update events/
    );
});

test("Delete Event", async () => {
    jest.setTimeout(10000);
    await ModelTestPass.delete<Event, EventAttributes>(baseWorld, Event, key, [
        "id",
    ]);
});

test("Read Event", async () => {
    jest.setTimeout(10000);
    await ModelTestPass.read<Event, EventAttributes>(baseWorld, Event, key, [
        "id",
    ]);
});
