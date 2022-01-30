import BaseWorld from "@test/support/base_world";
import Helpers from "@test/helpers";
import ModelTestPass from "@test/model/helpers/test/pass";
import ModelTestParentPrevent from "@test/model/helpers/test/parent_prevent";
import Department, { DepartmentAttributes } from "./department";
import DBConnection from "@test/support/db_connection";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.init);
afterAll(DBConnection.close);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Helpers.Model.setup.call(baseWorld, Department);
});

afterEach(async () => {
    if (!baseWorld) throw new Error(BaseWorld.errorMessage);
    await Helpers.Model.teardown.call(baseWorld, Department);
    baseWorld.resetProps();
});

test("Create Department", async () => {
    await ModelTestPass.create<Department, DepartmentAttributes>(
        baseWorld,
        Department
    );
});

test("Update Department", async () => {
    await ModelTestPass.update<Department, DepartmentAttributes>(
        baseWorld,
        Department,
        { name: "TEST" }
    );
});

test("Delete Department", async () => {
    await ModelTestPass.delete<Department, DepartmentAttributes>(
        baseWorld,
        Department,
        ["id"]
    );
});

test("Read Department", async () => {
    await ModelTestPass.read<Department, DepartmentAttributes>(
        baseWorld,
        Department,
        ["id"]
    );
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
