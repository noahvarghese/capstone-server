import Role from "@models/role";
import UserRole from "@models/user/user_role";
import { Entity, Column, Connection, Not } from "typeorm";
import { AttributeFactory } from "../abstract/base_model";
import EditableContentModel from "../abstract/editable_content_model";
import ManualAssignment from "./assignment";

export interface ManualAttributes {
    title: string;
    prevent_delete: boolean;
    prevent_edit: boolean;
    published: boolean;
    updated_by_user_id: number;
}

export const EmptyManualAttributes = (): ManualAttributes => ({
    title: "",
    prevent_delete: false,
    prevent_edit: false,
    published: false,
    updated_by_user_id: NaN,
});

@Entity({ name: "manual" })
export default class Manual
    extends EditableContentModel
    implements ManualAttributes
{
    @Column()
    public title!: string;
    @Column()
    public prevent_delete!: boolean;
    @Column()
    public prevent_edit!: boolean;
    @Column()
    public published!: boolean;

    public constructor(options?: Partial<ManualAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyManualAttributes));
    }

    public static isOwner = async (
        conn: Connection,
        user_id: number,
        manual_id: number
    ): Promise<boolean> => {
        return Boolean(
            await conn
                .createQueryBuilder()
                .select("ma")
                .from(ManualAssignment, "ma")
                .leftJoin(Role, "r", "ma.role_id = r.id")
                .leftJoin(UserRole, "ur", "ur.role_id = r.id")
                .where("ma.manual_id = :manual_id", { manual_id })
                .andWhere("ur.user_id = :user_id", { user_id })
                .andWhere("r.access = :access", { access: Not("USER") })
                .andWhere("ma.owner = :owner", { owner: true })
                .getOne()
        );
    };
}
