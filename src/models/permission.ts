import Logs from "@util/logs/logs";
import { Entity, Column, Connection } from "typeorm";
import { AttributeFactory } from "./abstract/base_model";
import EditableContentModel from "./abstract/editable_content_model";
import Membership from "./membership";
import Role from "./role";
import User from "./user/user";
import UserRole from "./user/user_role";

export type ValidPermission = keyof Omit<
    PermissionAttributes,
    "updated_by_user_id"
>;

export const PermissionKeys: ValidPermission[] = [
    "global_crud_users",
    "global_crud_department",
    "global_crud_role",
    "global_crud_resources",
    "global_assign_users_to_department",
    "global_assign_users_to_role",
    "global_assign_resources_to_department",
    "global_assign_resources_to_role",
    "global_view_reports",
    "dept_crud_role",
    "dept_crud_resources",
    "dept_assign_users_to_role",
    "dept_assign_resources_to_role",
    "dept_view_reports",
];

export interface PermissionAttributes {
    global_crud_users: boolean;
    global_crud_department: boolean;
    global_crud_role: boolean;
    global_crud_resources: boolean;
    global_assign_users_to_department: boolean;
    global_assign_users_to_role: boolean;
    global_assign_resources_to_department: boolean;
    global_assign_resources_to_role: boolean;
    global_view_reports: boolean;
    dept_crud_role: boolean;
    dept_crud_resources: boolean;
    dept_assign_users_to_role: boolean;
    dept_assign_resources_to_role: boolean;
    dept_view_reports: boolean;
    updated_by_user_id: number;
}

export const EmptyPermissionAttributes = (): PermissionAttributes => ({
    global_crud_users: false,
    global_crud_department: false,
    global_crud_role: false,
    global_crud_resources: false,
    global_assign_users_to_department: false,
    global_assign_users_to_role: false,
    global_assign_resources_to_department: false,
    global_assign_resources_to_role: false,
    global_view_reports: false,
    dept_crud_role: false,
    dept_crud_resources: false,
    dept_assign_users_to_role: false,
    dept_assign_resources_to_role: false,
    dept_view_reports: false,
    updated_by_user_id: -1,
});

@Entity({ name: "permission" })
export default class Permission
    extends EditableContentModel
    implements PermissionAttributes
{
    @Column()
    public global_crud_users!: boolean;
    @Column()
    public global_crud_department!: boolean;
    @Column()
    public global_crud_role!: boolean;
    @Column()
    public global_crud_resources!: boolean;
    @Column()
    public global_assign_users_to_department!: boolean;
    @Column()
    public global_assign_users_to_role!: boolean;
    @Column()
    public global_assign_resources_to_department!: boolean;
    @Column()
    public global_assign_resources_to_role!: boolean;
    @Column()
    public global_view_reports!: boolean;
    @Column()
    public dept_crud_role!: boolean;
    @Column()
    public dept_crud_resources!: boolean;
    @Column()
    public dept_assign_users_to_role!: boolean;
    @Column()
    public dept_assign_resources_to_role!: boolean;
    @Column()
    public dept_view_reports!: boolean;

    public constructor(options?: Partial<PermissionAttributes>) {
        super();
        Object.assign(
            this,
            AttributeFactory(options, EmptyPermissionAttributes)
        );
    }

    public static async getAllForUserAndBusiness(
        user_id: number,
        business_id: number,
        connection: Connection
    ): Promise<Permission[]> {
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
    }

    public static async checkPermission(
        user_id: number,
        business_id: number,
        connection: Connection,
        permission: (keyof Permission)[]
    ): Promise<boolean> {
        try {
            const permissions = await Permission.getAllForUserAndBusiness(
                user_id,
                business_id,
                connection
            );

            const result = permissions.find((p) => {
                for (const [key, value] of Object.entries(p)) {
                    if (permission.includes(key as keyof Permission) && value) {
                        return true;
                    }
                }
                return false;
            });

            return Boolean(result);
        } catch ({ message }) {
            Logs.Error(message);
            return false;
        }
    }
}
