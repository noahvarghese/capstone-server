import DBConnection from "@test/support/db_connection";
import ModelTestPass from "@test/model/helpers/test/pass";
import ModelTestFail from "@test/model/helpers/test/fail";
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
    await baseWorld.getConnection().manager.clear(Event);
    await Helpers.Model.teardown.call(baseWorld, Event);
    baseWorld.resetProps();
});

test("Create event success", async () => {
    try {
        await ModelTestPass.create<Event, EventAttributes>(baseWorld, Event);
    } catch (e) {
        const { message } = e as Error;
        if (!message.includes("EventDeleteError: Cannot delete events")) {
            throw e;
        }
    }
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

    try {
        await ModelTestFail.create<Event, EventAttributes>(
            baseWorld,
            Event,
            /EventInsertError: Must have either business_id or user_id/
        );
    } catch (e) {
        const { message } = e as Error;
        if (!message.includes("EventDeleteError: Cannot delete events")) {
            throw e;
        }
    }
});

test("Update Event should fail", async () => {
    try {
        await ModelTestFail.update<Event, EventAttributes>(
            baseWorld,
            Event,
            {
                status: "PASS",
            },
            /EventUpdateError: Cannot update events/
        );
    } catch (e) {
        const { message } = e as Error;
        if (!message.includes("EventDeleteError: Cannot delete events")) {
            throw e;
        }
    }
});

test("Delete Event should fail", async () => {
    jest.setTimeout(10000);
    await ModelTestFail.delete<Event, EventAttributes>(
        baseWorld,
        Event,
        /EventDeleteError: Cannot delete events/
    );
});

test("Read Event", async () => {
    jest.setTimeout(10000);
    try {
        await ModelTestPass.read<Event, EventAttributes>(baseWorld, Event, [
            "id",
        ]);
    } catch (e) {
        const { message } = e as Error;
        if (!message.includes("EventDeleteError: Cannot delete events")) {
            throw e;
        }
    }
});
