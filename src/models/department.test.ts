import BaseWorld from "@test/support/base_world";
import Helpers from "@test/helpers";
import ModelTestParentPrevent from "@test/model/helpers/test/parent_prevent";
import Department, { DepartmentAttributes } from "./department";
import DBConnection from "@test/support/db_connection";

let baseWorld: BaseWorld;

// Database setup
beforeAll(DBConnection.init);
afterAll(async () => {
    await DBConnection.close();
});

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Helpers.Model.setup.call(baseWorld, Department);
});

afterEach(async () => {
    await Helpers.Model.teardown.call(baseWorld, Department);
    baseWorld.resetProps();
});

test("Prevent Deletion of Department", async () => {
    await ModelTestParentPrevent.delete<
        Department,
        DepartmentAttributes,
        Department,
        DepartmentAttributes
    >(
        baseWorld,
        { type: Department, toggleAttribute: "prevent_delete" },
        Department,
        /DepartmentDeleteError: Cannot delete department while delete lock is set/
    );
});

test("Prevent edit of department", async () => {
    await ModelTestParentPrevent.update<
        Department,
        DepartmentAttributes,
        Department,
        DepartmentAttributes
    >(
        baseWorld,
        { type: Department, toggleAttribute: "prevent_edit" },
        { type: Department, attributesToUpdate: { name: "YOLO" } },
        /DepartmentUpdateError: Cannot edit department while edit lock is set/
    );
});
