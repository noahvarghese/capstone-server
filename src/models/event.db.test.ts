import DBConnection from "@test/support/db_connection";
import ModelTestFail from "@test/model/helpers/test/fail";
import BaseWorld from "@test/support/base_world";
import Event, { EventAttributes } from "./event";
import Helpers from "@test/helpers";

let baseWorld: BaseWorld;

beforeAll(DBConnection.init);
afterAll(async () => {
    await DBConnection.close();
});

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Helpers.Model.setup.call(baseWorld, Event);
});

afterEach(async () => {
    await Helpers.Model.teardown.call(baseWorld, Event);
    baseWorld.resetProps();
});

test("Create event without user_id or business_id", async () => {
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
        /EventInsertError: Must have either business_id or user_id/
    );
});

test("Update Event should fail", async () => {
    await ModelTestFail.update<Event, EventAttributes>(
        baseWorld,
        Event,
        {
            status: "PASS",
        },
        /EventUpdateError: Cannot update events/
    );
});
