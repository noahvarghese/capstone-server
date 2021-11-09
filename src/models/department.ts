import { Entity, Column, Connection } from "typeorm";
import BaseModel, { AttributeFactory } from "./abstract/base_model";
import Role from "./role";
import UserRole from "./user/user_role";

export interface DepartmentAttributes {
    name: string;
    business_id: number;
    prevent_delete: boolean;
    prevent_edit: boolean;
    updated_by_user_id: number;
}

export const EmptyDeparmentAttributes = (): DepartmentAttributes => ({
    name: "",
    business_id: -1,
    prevent_delete: false,
    prevent_edit: false,
    updated_by_user_id: -1,
});

@Entity({ name: "department" })
export default class Department
    extends BaseModel
    implements DepartmentAttributes
{
    @Column()
    public name!: string;
    @Column()
    public business_id!: number;
    @Column()
    public prevent_edit!: boolean;
    @Column()
    public prevent_delete!: boolean;
    @Column()
    public updated_by_user_id!: number;

    public constructor(options?: Partial<DepartmentAttributes>) {
        super();
        Object.assign(
            this,
            AttributeFactory(options, EmptyDeparmentAttributes)
        );
    }

    public async hasUser(
        user_id: number,
        connection: Connection
    ): Promise<boolean> {
        const roles = await connection.manager.find(Role, {
            where: { department_id: this.id },
        });

        try {
            await connection.manager.findOneOrFail(UserRole, {
                where: roles.map((r) => ({ user_id, role_id: r.id })),
            });
            return true;
        } catch (_) {
            return false;
        }
    }

    public static async getAdminForBusiness(
        business_id: number,
        connection: Connection
    ): Promise<Department> {
        return await connection.manager.findOneOrFail(Department, {
            where: { business_id, name: "Admin" },
        });
    }
}
