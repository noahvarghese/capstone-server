import Department from "@models/department";
import Permission from "@models/permission";
import Role from "@models/role";
import UserRole from "@models/user/user_role";
import Logs from "@util/logs/logs";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
    const {
        session: { current_business_id, user_id },
        SqlConnection,
    } = req;

    //check permissions
    const hasPermission = await Permission.checkPermission(
        Number(user_id),
        Number(current_business_id),
        SqlConnection,
        [
            "global_crud_role",
            "global_assign_resources_to_role",
            "global_assign_users_to_role",
        ]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    try {
        const returnVal: {
            name: string;
            numMembers: number;
            department: string;
        }[] = [];

        const roles = await SqlConnection.createQueryBuilder()
            .select("r")
            .from(Role, "r")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .where("d.business_id = :business_id", {
                business_id: current_business_id,
            })
            .getMany();

        for (const role of roles) {
            const numMembers = await SqlConnection.createQueryBuilder()
                .select("COUNT(ur.user_id)", "count")
                .from(Role, "r")
                .where("r.id = :role_id", { role_id: role.id })
                .leftJoin(UserRole, "ur", "ur.role_id = r.id")
                .getRawMany();

            const department = await SqlConnection.manager.findOneOrFail(
                Department,
                {
                    where: { id: role.department_id },
                }
            );

            returnVal.push({
                name: role.name,
                numMembers: numMembers[0].count,
                department: department.name,
            });
        }

        res.status(200).json({
            data: returnVal,
        });
        return;
    } catch (e) {
        Logs.Error(e.message);
        res.status(500).json({ message: "Unable to get roles" });
        return;
    }
});

router.post("/", async (req: Request, res: Response) => {
    const {
        session: { current_business_id, user_id },
        SqlConnection,
        body,
    } = req;

    //check permissions
    const hasPermission = await Permission.checkPermission(
        Number(user_id),
        Number(current_business_id),
        SqlConnection,
        ["global_crud_role"]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    // check role exists
    const count = await SqlConnection.manager.count(Role, {
        where: { ...body },
    });

    if (count > 0) {
        res.status(405).json({ message: "role exists" });
        return;
    }

    // try create
    try {
        const result = await SqlConnection.manager.insert(Role, new Role(body));

        if (result.identifiers.length === 1) {
            res.sendStatus(201);
            return;
        }
    } catch (e) {
        Logs.Error(e.message);
        res.status(500).json({ message: "Error creating role" });
    }
});
export default router;
