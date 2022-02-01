import Department from "@models/department";
import Permission from "@models/permission";
import Role from "@models/role";
import UserRole from "@models/user/user_role";
import { deepClone } from "@util/obj";
import Logs from "@util/logs/logs";
import { Request, Response, Router } from "express";
import { Connection } from "typeorm";

const router = Router();

type NavLinks = Record<string, boolean>;

export interface PossibleNavLinks extends NavLinks {
    home: boolean;
    members: boolean;
    departments: boolean;
    roles: boolean;
    manuals: boolean;
    quizzes: boolean;
    reports: boolean;
    scores: boolean;
    logout: boolean;
}

export type SharedNavLinks = Pick<
    PossibleNavLinks,
    "home" | "manuals" | "quizzes" | "logout"
>;

export type AdminNavLinks = Pick<
    PossibleNavLinks,
    "members" | "departments" | "roles" | "reports"
> &
    SharedNavLinks;

export type DefaultNavLinks = Pick<PossibleNavLinks, "scores"> & SharedNavLinks;

export class Nav {
    private userId: number;
    private businessId: number;
    private connection: Connection;
    private links: Partial<PossibleNavLinks> = Nav.produceSharedLinks();

    constructor(_businessId: number, _userId: number, _connection: Connection) {
        this.userId = _userId;
        this.businessId = _businessId;
        this.connection = _connection;
    }

    public async isAdmin(): Promise<boolean> {
        return await adminDepartmentHasUser(
            this.connection,
            this.businessId,
            this.userId
        );
    }

    public static produceAdminLinks(): AdminNavLinks {
        return deepClone({
            ...Nav.produceSharedLinks(),
            members: true,
            reports: true,
            roles: true,
            departments: true,
        });
    }

    public static produceDefaultLinks(): DefaultNavLinks {
        return deepClone({
            ...Nav.produceSharedLinks(),
            scores: true,
        });
    }

    public static produceSharedLinks(): SharedNavLinks {
        return deepClone({
            home: true,
            logout: true,
            manuals: true,
            quizzes: true,
        });
    }

    private async setLinksByPermission(): Promise<void> {
        const permissions = await Permission.getAllForUserAndBusiness(
            this.userId,
            this.businessId,
            this.connection
        );

        for (const permission of permissions) {
            for (const [key, value] of Object.entries(permission)) {
                if (key.includes("users") && value === true) {
                    this.links.members = true;
                } else if (key.includes("department") && value === true) {
                    this.links.departments = true;
                } else if (key.includes("role") && value === true) {
                    this.links.roles = true;
                } else if (key.includes("reports") && value === true) {
                    this.links.reports = true;
                }
            }
        }
    }

    public async getLinks(): Promise<Partial<PossibleNavLinks>> {
        if (await this.isAdmin()) {
            this.links = Nav.produceAdminLinks();
        } else {
            this.links = Nav.produceDefaultLinks();
            await this.setLinksByPermission();
        }

        return this.links;
    }
}

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
        dbConnection,
        session: { user_id, current_business_id },
    } = req;

    if (!user_id || !current_business_id) {
        res.status(400).json({ message: "Not authenticated" });
        throw new Error("Not authenticated");
    }

    const nav = new Nav(current_business_id, user_id, dbConnection);
    const links = await nav.getLinks();

    res.status(200).json(links);
    return;
});

export default router;
