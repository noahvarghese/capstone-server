import bcrypt from "bcryptjs";
import { Entity, Column, Connection } from "typeorm";
import BaseModel, { AttributeFactory } from "@models/abstract/base_model";
import validator from "validator";
import Role from "@models/role";
import Permission, { PermissionAttributes } from "@models/permission";
import Membership from "@models/membership";
import UserRole from "./user_role";

export interface UserAttributes {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    birthday: Date | undefined;
    password: string;
    token?: string | undefined | null;
    token_expiry?: Date | undefined | null;
}

export const EmptyUserAttributes = (): UserAttributes => ({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    birthday: undefined,
    password: "",
    token: undefined,
    token_expiry: undefined,
});

@Entity({ name: "user" })
export default class User extends BaseModel implements UserAttributes {
    @Column()
    public first_name!: string;
    @Column()
    public last_name!: string;
    @Column()
    public email!: string;
    @Column({ nullable: true })
    public phone!: string;
    @Column()
    public birthday!: Date;
    @Column()
    public password!: string;
    @Column({ nullable: true, type: "text", unique: true })
    public token?: string | null | undefined;
    @Column({ nullable: true, type: "datetime", unique: false })
    public token_expiry?: Date | null | undefined;

    public constructor(options?: Partial<UserAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyUserAttributes));
    }

    public compareToken = (_token: string): boolean => {
        if (
            this.token_expiry &&
            this.token_expiry.getTime() > new Date().getTime()
        ) {
            return this.token === _token;
        }
        return false;
    };

    public comparePassword = async (_password: string): Promise<boolean> => {
        return await new Promise((res, rej) => {
            bcrypt.compare(_password, this.password, (err, same) => {
                if (err) {
                    rej(err);
                }
                res(same);
            });
        });
    };

    // pass reference back so we can chain it within the connection.manager.save method
    public async hashPassword(this: User, _password: string): Promise<User> {
        const hash = await new Promise<string>((res, rej) => {
            bcrypt.hash(_password, 12, (err, hash) => {
                if (err) {
                    rej(err);
                }

                res(hash);
            });
        });

        this.password = hash;
        return this;
    }

    public resetPassword = async (password: string): Promise<void> => {
        if (validator.isEmpty(password, { ignore_whitespace: true }))
            throw new Error("Password cannot be empty");
        await this.hashPassword(password);
        this.token = null;
        this.token_expiry = null;
    };

    public static async getRoles(
        connection: Connection,
        id: number,
        business_id: number,
        permissions?: Omit<keyof PermissionAttributes, "updated_by_user_id">[]
    ): Promise<
        Omit<
            Role & Permission,
            "created_on" | "updated_on" | "deleted_on" | "updated_by_user_id"
        >[]
    > {
        let query = connection
            .createQueryBuilder()
            .select("r")
            .addSelect("p")
            .from(Role, "r")
            .leftJoin(Permission, "p", "p.id = r.permission_id")
            .leftJoin(UserRole, "ur", "ur.role_id = r.id")
            .leftJoin(User, "u", "u.id = ur.user_id")
            .leftJoin(Membership, "m", "m.user_id = u.id")
            .where("m.user_id = :id", { id })
            .andWhere("m.business_id = :business_id", {
                business_id,
            });

        if (permissions) {
            for (const perm of permissions) {
                query = query.andWhere(`p.${perm} = 1`);
            }
        }

        const roles = await query.getRawMany();

        return roles.map((raw) => ({
            name: raw.r_name,
            id: raw.r_id,
            prevent_edit: raw.r_prevent_edit,
            prevent_delete: raw.r_prevent_delete,
            department_id: raw.r_department_id,
            permission_id: raw.r_permission_id,
            global_crud_users: raw.p_global_crud_users,
            global_crud_department: raw.p_global_crud_department,
            global_crud_role: raw.p_global_crud_role,
            global_assign_resources_to_role:
                raw.p_global_assign_resources_to_role,
            global_assign_users_to_role: raw.p_global_assign_users_to_role,
            global_crud_resources: raw.p_global_crud_resources,
            global_view_reports: raw.p_global_view_reports,
            dept_assign_resources_to_role: raw.p_dept_assign_resources_to_role,
            dept_assign_users_to_role: raw.p_dept_assign_users_to_role,
            dept_crud_resources: raw.p_dept_crud_resources,
            dept_crud_role: raw.p_dept_crud_role,
            dept_view_reports: raw.p_dept_view_reports,
        }));
    }

    public static async hasGlobalPermission(
        connection: Connection,
        id: number,
        business_id: number,
        permissions: Omit<keyof PermissionAttributes, "updated_by_user_id">[]
    ): Promise<boolean> {
        for (const p of permissions) {
            if (!p.startsWith("global_")) {
                throw new Error("Invalid argument " + p);
            }
        }

        const roles = await User.getRoles(
            connection,
            id,
            business_id,
            permissions
        );

        return roles.length > 0;
    }
}
