import Department from "@models/department";
import Role from "@models/role";
import UserRole from "@models/user/user_role";
import Logs from "@util/logs/logs";
import { Connection } from "typeorm";

export const hasUser = async (
    connection: Connection,
    departmentName: string,
    business_id: number,
    user_id: number
): Promise<boolean> => {
    try {
        const foundDepartments = await connection
            .createQueryBuilder()
            .select("d")
            .from(Department, "d")
            .where("d.business_id = :business_id", { business_id })
            .andWhere("d.name = :name", { name: departmentName })
            .andWhere("ur.user_id = :user_id", { user_id })
            .leftJoin(Role, "r", "r.department_id = d.id")
            .leftJoin(UserRole, "ur", "ur.role_id = r.id")
            .getMany();

        return foundDepartments.length === 1;
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        return false;
    }
};
