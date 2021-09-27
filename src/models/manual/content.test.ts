import BaseWorld from "../../../test/jest/support/base_world";
import DBConnection from "../../../test/util/db_connection";

import ModelActions from "../../../test/helpers/model/actions";
import ModelTestPass from "../../../test/helpers/model/test/pass";
import ModelTestFail from "../../../test/helpers/model/test/fail";
import Business, { BusinessAttributes } from "../business";
import Department, { DepartmentAttributes } from "../department";
import Permission, { PermissionAttributes } from "../permission";
import Role, { RoleAttributes } from "../role";
import User, { UserAttributes } from "../user/user";
import Content, { ContentAttributes } from "./content";
import Manual, { ManualAttributes } from "./manual";
import Policy, { PolicyAttributes } from "./policy/policy";
import Section, { ManualSectionAttributes } from "./section";
import ModelError from "../../../test/util/model_error";
import {
    createModels,
    loadAttributes,
} from "../../../test/helpers/model/test/setup";
import { teardown } from "../../../test/helpers/model/test/teardown";

let baseWorld: BaseWorld | undefined;

// Database setup
beforeAll(DBConnection.InitConnection);
afterAll(DBConnection.CloseConnection);

// State Setup
beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.GetConnection());
    loadAttributes(baseWorld, Content);
    await createModels(baseWorld, Content);
});

afterEach(async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }
    await teardown(baseWorld, Content);
    baseWorld = undefined;
});

// Tests
test("Create Content", async () => {
    await ModelTestPass.create<Content, ContentAttributes>(baseWorld, Content);
});

test("Update Content", async () => {
    await ModelTestPass.update<Content, ContentAttributes>(
        baseWorld,
        Content,

        {
            title: "TEST",
        }
    );
});

test("Delete Content", async () => {
    await ModelTestPass.delete<Content, ContentAttributes>(
        baseWorld,
        Content,

        ["id"]
    );
});

test("Read Content", async () => {
    await ModelTestPass.read<Content, ContentAttributes>(
        baseWorld,
        Content,

        ["id"]
    );
});

test("Delete Content while Manual is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelActions.update<Manual, ManualAttributes>(baseWorld, Manual, {
        prevent_edit: true,
    });

    try {
        await ModelTestFail.delete<Content, ContentAttributes>(
            baseWorld,
            Content,
            /ContentDeleteError: Cannot delete content while the manual is locked from editing/
        );

        await ModelActions.update<Manual, ManualAttributes>(baseWorld, Manual, {
            prevent_edit: false,
        });

        await ModelActions.delete<Content>(baseWorld, Content);
    } catch (e) {
        if (e instanceof ModelError) {
            if (e.deleted !== undefined && e.deleted !== false) {
                await ModelActions.delete<Content>(baseWorld, Content);
            }
        }
        throw e;
    }
});

test("Update Content while Manual is locked doesn't work", async () => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await ModelActions.update<Manual, ManualAttributes>(baseWorld, Manual, {
        prevent_edit: true,
    });

    try {
        await ModelTestFail.update<Content, ContentAttributes>(
            baseWorld,
            Content,

            { title: "YOLO" },
            /ContentUpdateError: Cannot update content while the manual is locked from editing/
        );
    } catch (e) {
        if (
            /ContentDeleteError: Cannot delete content while the manual is locked from editing/.test(
                e.message
            )
        ) {
            await ModelActions.update<Manual, ManualAttributes>(
                baseWorld,
                Manual,
                { prevent_edit: false }
            );

            await ModelActions.delete<Content>(baseWorld, Content);
        }
    }
});
