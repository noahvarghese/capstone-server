import Department from "@models/department";
import Permission from "@models/permission";
import Role from "@models/role";
import UserRole from "@models/user/user_role";
import Logs from "@util/logs/logs";
import { Request, Response, Router } from "express";
import { Connection } from "typeorm";

const router = Router();

const adminDepartmentHasUser = async (
    connection: Connection,
    business_id: number,
    user_id: number
): Promise<boolean> => {
    let adminDepartmentId: number;
    let roles: Role[];

    try {
        const adminDepartment = await connection.manager.findOneOrFail(
            Department,
            {
                where: { business_id, name: "Admin" },
            }
        );

        adminDepartmentId = adminDepartment.id;
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        throw new Error("Unable to get administrator department");
    }

    try {
        roles = await connection.manager.find(Role, {
            where: { department_id: adminDepartmentId },
        });
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        throw new Error("Unable to get roles in administrator department");
    }

    try {
        await connection.manager.findOneOrFail(UserRole, {
            where: roles.map((r) => ({ user_id, role_id: r.id })),
        });
        return true;
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        return false;
    }
};

router.get("/", async (req: Request, res: Response) => {
    const {
        SqlConnection: connection,
        session: { user_id, current_business_id },
    } = req;

    const navLinks: { [o: string]: boolean } = {
        home: true,
        members: false,
        departments: false,
        roles: false,
        manuals: true,
        quizzes: true,
        reports: false,
        scores: false,
        logout: true,
    };

    try {
        if (
            await adminDepartmentHasUser(
                connection,
                Number(current_business_id),
                Number(user_id)
            )
        ) {
            navLinks.members = true;
            navLinks.departments = true;
            navLinks.roles = true;
            navLinks.manuals = true;
            navLinks.quizzes = true;
            navLinks.reports = true;
            res.status(200).json(navLinks);
            return;
        }
    } catch (_) {
        res.status(500).json({ message: "no admin department found" });
    }

    // default links for regular users
    navLinks.manuals = true;
    navLinks.quizzes = true;
    navLinks.scores = true;

    const permissions = await Permission.getAllForUserAndBusiness(
        Number(user_id),
        Number(current_business_id),
        connection
    );

    for (const permission of permissions) {
        for (const [key, value] of Object.entries(permission)) {
            if (key.includes("users") && value === true) {
                navLinks.members = true;
            } else if (key.includes("department") && value === true) {
                navLinks.departments = true;
            } else if (key.includes("role") && value === true) {
                navLinks.roles = true;
            } else if (key.includes("reports") && value === true) {
                navLinks.reports = true;
            }
        }
    }

    res.status(200).json(navLinks);
    return;
});

export default router;
