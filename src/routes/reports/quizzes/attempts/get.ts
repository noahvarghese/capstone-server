import Department from "@models/department";
import ManualAssignment from "@models/manual/assignment";
import Role from "@models/role";
import User from "@models/user/user";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        dbConnection,
    } = req;

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, user_id!),
    ]);

    if (!(isAdmin || isManager)) {
        res.sendStatus(403);
        return;
    }

    const [roles, departments] = await Promise.all([
        dbConnection
            .createQueryBuilder()
            .select("r")
            .addSelect("d")
            .addSelect(
                "(SELECT COUNT(*) FROM quiz_attempt qa " +
                    "LEFT JOIN quiz qq ON qq.id = qa.quiz_id " +
                    "LEFT JOIN manual_assignment mma ON mma.manual_id = qq.manual_id " +
                    "WHERE mma.role_id = r.id)",
                "total_attempts"
            )
            .from(Role, "r")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .leftJoin(ManualAssignment, "ma", "ma.role_id = r.id")
            .where("d.business_id = :current_business_id", {
                current_business_id,
            })
            .andWhere("ma.role_id IS NOT NULL")
            .getRawMany<{
                r_id: number;
                r_name: string;
                d_id: number;
                d_name: string;
                total_attempts: number;
            }>(),
        dbConnection
            .createQueryBuilder()
            .select("d")
            .addSelect(
                "(SELECT COUNT(*) FROM quiz_attempt qa " +
                    "LEFT JOIN quiz q ON q.id = qa.quiz_id " +
                    "LEFT JOIN manual_assignment ma ON ma.manual_id = q.manual_id " +
                    "LEFT JOIN role r ON r.id = ma.role_id " +
                    "WHERE r.department_id = d.id)",
                "total_attempts"
            )
            .from(Department, "d")
            .where("d.business_id = :current_business_id", {
                current_business_id,
            })
            .getRawMany<{
                d_id: number;
                d_name: string;
                total_attempts: number;
            }>(),
    ]);

    Logs.Error(roles, departments);

    res.status(200).send({
        role_details: roles.map((m) => ({
            id: m.r_id,
            name: m.r_name,
            total_attempts: Number(m.total_attempts),
            department: { id: m.d_id, name: m.d_name },
        })),
        department_details: departments.map((m) => ({
            id: m.d_id,
            name: m.d_name,
            total_attempts: Number(m.total_attempts),
        })),
    });
};

export default getController;
