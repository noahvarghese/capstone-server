import BaseWorld from "../../test/jest/support/base_world";
import DBConnection from "../../test/util/db_connection";
import ModelActions from "../../test/helpers/model/actions";
import ModelTestPass from "../../test/helpers/model/test/pass";
import ModelTestFail from "../../test/helpers/model/test/fail";
import Department, { DepartmentAttributes } from "./department";
import {
    createModels,
    loadAttributes,
} from "../../test/helpers/model/test/setup";
import { teardown } from "../../test/helpers/model/test/teardown";

let baseWorld: BaseWorld | undefined;
const key = "department";

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, key);
    await createModels(baseWorld, key);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await teardown<Department>(baseWorld, Department, key);
    baseWorld = undefined;
});

test("Create Department", async () => {
    await ModelTestPass.create<Department, DepartmentAttributes>(
        baseWorld,
        Department,
        key
    );
});

test("Update Department", async () => {
    await ModelTestPass.update<Department, DepartmentAttributes>(
        baseWorld,
        Department,
        key,
        { name: "TEST" }
    );
});

test("Delete Department", async () => {
    await ModelTestPass.delete<Department, DepartmentAttributes>(
        baseWorld,
        Department,
        key,
        ["id"]
    );
});

test("Read Department", async () => {
    await ModelTestPass.read<Department, DepartmentAttributes>(
        baseWorld,
        Department,
        key,
        ["id"]
    );
});

test("Prevent Deletion of Department", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    // set prevent delete in environment data
    baseWorld.setCustomProp<DepartmentAttributes>("departmentAttributes", {
        ...baseWorld.getCustomProp<DepartmentAttributes>(
            "departmentAttributes"
        ),
        prevent_delete: true,
    });

    try {
        await ModelTestFail.delete(
            baseWorld,
            Department,
            key,
            /DepartmentDeleteError: Cannot delete department while delete lock is set/
        );

        await ModelActions.update<Department, DepartmentAttributes>(
            baseWorld,
            Department,
            key,
            {
                prevent_delete: false,
            }
        );

        await ModelActions.delete<Department>(baseWorld, Department, key);
    } catch (e) {
        if (e.deleted !== undefined && e.deleted !== false) {
            await ModelActions.delete<Department>(baseWorld, Department, key);
        }
    }
});
