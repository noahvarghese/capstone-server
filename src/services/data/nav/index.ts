import * as departmentService from "@services/data/department";
import * as permissionService from "@services/data/permission";
import { deepClone } from "@util/obj";
import { Connection } from "typeorm";

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

export default class Nav {
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
        return await departmentService.hasUser(
            this.connection,
            "Admin",
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
        const permissions = await permissionService.getAll(
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
