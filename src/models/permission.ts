import Logs from "@util/logs/logs";
import { Entity, Column, Connection } from "typeorm";
import { AttributeFactory } from "./abstract/base_model";
import EditableContentModel from "./abstract/editable_content_model";
import Membership from "./membership";
import Role from "./role";
import User from "./user/user";
import UserRole from "./user/user_role";

export interface PermissionAttributes {
    global_crud_users: boolean;
    global_crud_department: boolean;
    global_crud_role: boolean;
    global_crud_resources: boolean;
    global_assign_users_to_role: boolean;
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
    global_assign_users_to_role: false,
    global_assign_resources_to_role: false,
    global_view_reports: false,
    dept_crud_role: false,
    dept_crud_resources: false,
    dept_assign_users_to_role: false,
    dept_assign_resources_to_role: false,
    dept_view_reports: false,
    updated_by_user_id: NaN,
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
    public global_assign_users_to_role!: boolean;
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

    public static async getAll(
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

    public static async hasPermission(
        user_id: number,
        business_id: number,
        connection: Connection,
        searchKeys: (keyof Permission)[]
    ): Promise<boolean> {
        try {
            let permissions = await Permission.getAll(
                user_id,
                business_id,
                connection
            );

            permissions = permissions.filter((p) => {
                for (const key of searchKeys) {
                    if (Object.keys(p).includes(key) && p[key]) {
                        return true;
                    }
                }
                return false;
            });

            return permissions.length > 0;
        } catch ({ message }) {
            Logs.Error(message);
            return false;
        }
    }
}
