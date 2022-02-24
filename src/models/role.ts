import { Entity, Column, Connection } from "typeorm";
import { AttributeFactory } from "./abstract/base_model";
import EditableContentModel from "./abstract/editable_content_model";
import Department from "./department";
import UserRole from "./user/user_role";

const accessKeys = ["ADMIN", "MANAGER", "USER"] as const;
export type AccessKey = typeof accessKeys[number];

export interface RoleAttributes {
    name: string;
    department_id: number;
    access: AccessKey;
    prevent_delete: boolean;
    prevent_edit: boolean;
    updated_by_user_id: number;
}

export const EmptyRoleAttributes = (): RoleAttributes => ({
    name: "",
    department_id: NaN,
    access: "USER",
    prevent_delete: false,
    updated_by_user_id: NaN,
    prevent_edit: false,
});

@Entity()
export default class Role
    extends EditableContentModel
    implements RoleAttributes
{
    @Column()
    public name!: string;
    @Column()
    public department_id!: number;
    @Column()
    public access!: AccessKey;
    @Column()
    public prevent_edit!: boolean;
    @Column()
    public prevent_delete!: boolean;

    public constructor(options?: Partial<RoleAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyRoleAttributes));
    }

    public static hasManager = async (
        conn: Connection,
        user_id: number,
        role_id: number
    ): Promise<boolean> => {
        try {
            const department_id = (
                await conn.manager.findOneOrFail(Role, {
                    where: { id: role_id },
                })
            )?.department_id;

            const department = await conn.manager.findOneOrFail(Department, {
                where: {
                    id: department_id,
                },
            });

            const departmentManagerRole = await conn.manager.findOneOrFail(
                Role,
                {
                    where: { department_id: department?.id, access: "MANAGER" },
                }
            );

            await conn.manager.findOneOrFail(UserRole, {
                where: { user_id, role_id: departmentManagerRole?.id },
            });

            return true;
        } catch (_e) {
            return false;
        }
    };
}
