import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/helpers/model/test/pass";
import ModelTestFail from "@test/helpers/model/test/fail";
import BaseWorld from "@test/support/base_world";
import Event, { EventAttributes } from "./event";
import Helpers from "@test/helpers";

let baseWorld: BaseWorld | undefined;

beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Helpers.Model.setup.call(baseWorld, Event);
});

afterEach(async () => {
    if (!baseWorld) throw new Error(BaseWorld.errorMessage);
    await Helpers.Model.teardown.call(baseWorld, Event);
    baseWorld.resetProps();
});

test("Create event success", async () => {
    await ModelTestPass.create<Event, EventAttributes>(baseWorld, Event);
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

test("Delete Event", async () => {
    jest.setTimeout(10000);
    await ModelTestPass.delete<Event, EventAttributes>(baseWorld, Event, [
        "id",
    ]);
});

test("Read Event", async () => {
    jest.setTimeout(10000);
    await ModelTestPass.read<Event, EventAttributes>(baseWorld, Event, ["id"]);
});
