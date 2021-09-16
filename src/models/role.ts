import { Entity, Column } from "typeorm";
import EditableContentModel from "./abstract/editable_content_model";

export interface RoleAttributes {
    name: string;
    department_id: number;
    permission_id: number;
    updated_by_user_id: number;
}

const EmptyRoleAttributes = (): RoleAttributes => ({
    name: "",
    department_id: -1,
    permission_id: -1,
    updated_by_user_id: -1,
});

const RoleBuilder = <T extends Partial<RoleAttributes>>(
    options?: T
): RoleAttributes & T => Object.assign(EmptyRoleAttributes(), options);

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

    public constructor(options?: Partial<RoleAttributes>) {
        super();
        const attr = RoleBuilder(options);
        Object.assign(this, attr);
    }
}
