import { Entity, Column } from "typeorm";
import { AttributeFactory } from "./abstract/base_model";
import EditableContentModel from "./abstract/editable_content_model";

export interface RoleAttributes {
    name: string;
    department_id: number;
    permission_id: number;
    prevent_delete: boolean;
    prevent_edit: boolean;
    updated_by_user_id: number;
}

export const EmptyRoleAttributes = (): RoleAttributes => ({
    name: "",
    department_id: NaN,
    permission_id: NaN,
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
    public permission_id!: number;
    @Column()
    public prevent_edit!: boolean;
    @Column()
    public prevent_delete!: boolean;

    public constructor(options?: Partial<RoleAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyRoleAttributes));
    }
}
