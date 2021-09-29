import { After, Before } from "@cucumber/cucumber";
import { Connection } from "typeorm";
import DBConnection from "../../util/db_connection";
import BaseWorld from "../support/base_world";
import dependencies from "../../sample_data/dependencies";
import types from "../../sample_data/types";
import UserRole from "../../../src/models/user/user_role";
import Role from "../../../src/models/role";
import Department from "../../../src/models/department";

Before("@db", async function (this: BaseWorld) {
    this.setCustomProp<Connection>(
        "connection",
        await DBConnection.GetConnection()
    );
});

After("@db", async function (this: BaseWorld) {
    this.setCustomProp<undefined>("connection", undefined);
});

After({ tags: "@signup_business" }, async function (this: BaseWorld) {
    const deps = dependencies["userRole"];

    const connection = this.getCustomProp<Connection>("connection");

    // turn off prevent delete for role and department
    const roles = await connection.manager.find(Role, {
        where: { prevent_delete: true },
    });

    for (const role of roles) {
        await connection.manager.save(Role, { ...role, prevent_delete: false });
    }

    const departments = await connection.manager.find(Department, {
        where: { prevent_delete: true },
    });

    for (const dept of departments) {
        await connection.manager.save(Department, {
            ...dept,
            prevent_delete: false,
        });
    }

    await connection.manager.remove(
        await connection.manager.find<UserRole>(UserRole)
    );

    for (let i = deps.length - 1; i >= 0; i--) {
        const dependency = deps[i];
        const type = types[dependency];

        await connection.manager.remove(
            await connection.manager.find<typeof type>(type)
        );
    }
});
