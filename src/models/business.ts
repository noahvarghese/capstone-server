import { Entity, Column, Connection } from "typeorm";
import BaseModel, { AttributeFactory } from "./abstract/base_model";
import Department from "./department";
import Role, { AccessKey } from "./role";
import UserRole from "./user/user_role";

export interface BusinessAttributes {
    name: string;
    address: string;
    city: string;
    postal_code: string;
    province: string;
    country: string;
}

export const EmptyBusinessAttributes = (): BusinessAttributes => ({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    province: "",
    country: "",
});

@Entity({ name: "business" })
export default class Business extends BaseModel implements BusinessAttributes {
    @Column()
    public name!: string;
    @Column()
    public address!: string;
    @Column()
    public city!: string;
    @Column()
    public postal_code!: string;
    @Column()
    public province!: string;
    @Column()
    public country!: string;

    public constructor(options?: Partial<BusinessAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyBusinessAttributes));
    }

    private static getRoleByAccess = async (
        conn: Connection,
        business_id: number,
        user_id: number,
        access: AccessKey
    ): Promise<Role | undefined> =>
        await conn
            .createQueryBuilder()
            .select("r")
            .from(Role, "r")
            .leftJoin(UserRole, "ur", "ur.role_id = r.id")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .where("d.business_id = :business_id", { business_id })
            .andWhere("ur.user_id = :user_id", { user_id })
            .andWhere("r.access = :access", { access })
            .orderBy("ur.created_on", "DESC")
            .getOne();

    public static getAdminRole = async (
        conn: Connection,
        business_id: number,
        user_id: number
    ): Promise<Role | undefined> =>
        await Business.getRoleByAccess(conn, business_id, user_id, "ADMIN");

    public static getManagerRole = async (
        conn: Connection,
        business_id: number,
        user_id: number
    ): Promise<Role | undefined> =>
        await Business.getRoleByAccess(conn, business_id, user_id, "MANAGER");
}
