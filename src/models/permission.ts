import { Entity, Column } from "typeorm";
import EditableContentModel from "./abstract/editable_content_model";

export interface PermissionAttributes {
    add_users_to_business: boolean;
    assign_users_to_department: boolean;
    assign_users_to_role: boolean;
    create_resources: boolean;
    assign_resources_to_department: boolean;
    assign_resources_to_role: boolean;
    updated_by_user_id: number;
}

const EmptyPermissionAttributes = (): PermissionAttributes => ({
    add_users_to_business: false,
    assign_users_to_department: false,
    assign_users_to_role: false,
    create_resources: false,
    assign_resources_to_department: false,
    assign_resources_to_role: false,
    updated_by_user_id: -1,
});

const PermissionBuilder = <T extends Partial<PermissionAttributes>>(
    options?: T
): PermissionAttributes & T =>
    Object.assign(EmptyPermissionAttributes(), options);

@Entity({ name: "permission" })
export default class Permission
    extends EditableContentModel
    implements PermissionAttributes
{
    @Column()
    public add_users_to_business!: boolean;
    @Column()
    public assign_users_to_role!: boolean;
    @Column()
    public assign_users_to_department!: boolean;
    @Column()
    public create_resources!: boolean;
    @Column()
    public assign_resources_to_department!: boolean;
    @Column()
    public assign_resources_to_role!: boolean;

    public constructor(options?: Partial<PermissionAttributes>) {
        super();
        const attr = PermissionBuilder(options);
        Object.assign(this, attr);
    }
}
