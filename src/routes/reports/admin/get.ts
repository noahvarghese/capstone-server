import Department from "@models/department";
import User from "@models/user/user";
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

    const result = (
        await dbConnection
            .createQueryBuilder()
            .select("d")
            .addSelect(
                "(SELECT COUNT(*) FROM user u " +
                    "LEFT JOIN user_role ur ON u.id = ur.user_id " +
                    "LEFT JOIN role r ON r.id = ur.role_id " +
                    "WHERE r.department_id = d.id " +
                    'AND r.access IN ("ADMIN", "MANAGER") ' +
                    ") AS managers"
            )
            .from(Department, "d")
            .where("d.business_id = :current_business_id", {
                current_business_id,
            })
            .getRawMany<{
                d_id: number;
                d_name: string;
                d_business_id: number;
                d_updated_by_user_id: number;
                d_created_on: Date;
                d_updated_on: Date;
                d_deleted_on: Date | null;
                managers: number;
            }>()
    ).map((r) => ({
        id: r.d_id,
        business_id: r.d_business_id,
        created_on: r.d_created_on,
        updated_by_user_id: r.d_updated_by_user_id,
        updated_on: r.d_updated_on,
        deleted_on: r.d_deleted_on,
        name: r.d_name,
        managers: Number(r.managers),
    })) as (Department & { managers: number })[];

    res.status(200).send(result);
};

export default getController;
