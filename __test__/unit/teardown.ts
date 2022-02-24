import Business from "@models/business";
import Department from "@models/department";
import Manual from "@models/manual/manual";
import Membership from "@models/membership";
import Quiz from "@models/quiz/quiz";
import Role from "@models/role";
import User from "@models/user/user";
import { Connection } from "typeorm";

const ALL = () => "";

/**
 * Deletes are all cascaded
 * @param conn
 */
export const unitTeardown = async (conn: Connection): Promise<void> => {
    await Promise.all([
        conn.manager.update(Membership, () => "", { prevent_delete: false }),
        conn.manager.update(Role, () => "", {
            prevent_delete: false,
            prevent_edit: false,
        }),
        conn.manager.update(Department, () => "", {
            prevent_delete: false,
            prevent_edit: false,
        }),
        conn.manager.update(Manual, () => "", {
            prevent_delete: false,
            prevent_edit: false,
        }),
        conn.manager.update(Quiz, () => "", {
            prevent_delete: false,
            prevent_edit: false,
        }),
    ]);

    await conn.manager.delete(Business, ALL);
    await conn.manager.delete(User, ALL);
};
