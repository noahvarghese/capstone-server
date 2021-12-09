import Membership from "@models/membership";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import Logs from "@util/logs/logs";
import { Connection } from "typeorm";

export const check = async (
    user_id: number,
    business_id: number,
    connection: Connection,
    required: (keyof Permission)[]
): Promise<boolean> => {
    try {
        if (required.length === 0) return true;

        const permissions = await getAll(user_id, business_id, connection);

        return (
            permissions.filter(
                (p) =>
                    (Object.entries(p) as [keyof Permission, boolean][]).find(
                        ([k, v]) => required.includes(k) && v
                    ) !== undefined
            ).length > 0
        );
    } catch ({ message }) {
        Logs.Error(message);
        return false;
    }
};

export const getAll = async (
    user_id: number,
    business_id: number,
    connection: Connection
): Promise<Permission[]> => {
    try {
        const permissions = await connection
            .createQueryBuilder()
            .select("p")
            .from(Permission, "p")
            .leftJoin(Role, "r", "r.permission_id = p.id")
            .leftJoin(UserRole, "ur", "ur.role_id = r.id")
            .leftJoin(User, "u", "u.id = ur.user_id")
            .leftJoin(Membership, "m", "m.user_id = u.id")
            .where("m.user_id = :user_id", { user_id })
            .andWhere("m.business_id = :business_id", {
                business_id,
            })
            .getMany();
        return permissions;
    } catch (e) {
        if (e instanceof Error) Logs.Error(e.message);
        return [];
    }
};
