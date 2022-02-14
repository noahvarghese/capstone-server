import Department from "@models/department";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        dbConnection,
        params: { manual_id: id },
    } = req;

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, user_id!),
    ]);

    let result = undefined;

    if (isAdmin) {
        result = await dbConnection
            .createQueryBuilder()
            .select(
                "m.id, m.title, m.published, m.prevent_delete, m.prevent_edit"
            )
            .addSelect("1", "editable_by_user")
            .from(Manual, "m")
            .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
            .leftJoin(Role, "r", "r.id = ma.role_id")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .where("d.business_id = :current_business_id", {
                current_business_id,
            })
            .andWhere("m.id = :id", { id })
            .getRawOne();
    } else if (isManager) {
        result = await dbConnection
            .createQueryBuilder()
            .select(
                "m.id, m.title, m.published, m.prevent_delete, m.prevent_edit"
            )
            .addSelect("1", "editable_by_user")
            .from(Manual, "m")
            .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
            .leftJoin(Role, "r", "r.id = ma.role_id")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .leftJoin(UserRole, "ur", "ur.role_id = r.id")
            .where("ur.user_id = :user_id", { user_id })
            .andWhere("r.access = :access", { access: "MANAGER" })
            .andWhere("d.business_id = :current_business_id", {
                current_business_id,
            })
            .andWhere("m.id = :id", { id })
            .getRawOne();
    } else {
        result = await dbConnection
            .createQueryBuilder()
            .select(
                "m.id, m.title, m.published, m.prevent_delete, m.prevent_edit"
            )
            .addSelect("0", "editable_by_user")
            .from(Manual, "m")
            .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
            .leftJoin(Role, "r", "r.id = ma.role_id")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .leftJoin(UserRole, "ur", "ur.role_id = r.id")
            .where("ur.user_id = :user_id", { user_id })
            .andWhere("r.access = :access", { access: "USER" })
            .andWhere("m.published = :published", { published: true })
            .andWhere("d.business_id = :current_business_id", {
                current_business_id,
            })
            .andWhere("m.id = :id", { id })
            .getRawOne();
    }

    res.status(200).send(result);
};

export default getController;
