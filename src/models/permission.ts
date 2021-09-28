import { Entity, Column } from "typeorm";
import { AttributeFactory } from "./abstract/base_model";
import EditableContentModel from "./abstract/editable_content_model";

export interface PermissionAttributes {
    add_users: boolean;
    edit_users: boolean;
    delete_users: boolean;
    assign_users_to_department: boolean;
    assign_users_to_role: boolean;
    create_resources: boolean;
    assign_resources_to_department: boolean;
    assign_resources_to_role: boolean;
    updated_by_user_id: number;
}

export const EmptyPermissionAttributes = (): PermissionAttributes => ({
    add_users: false,
    edit_users: false,
    delete_users: false,
    assign_users_to_department: false,
    assign_users_to_role: false,
    create_resources: false,
    assign_resources_to_department: false,
    assign_resources_to_role: false,
    updated_by_user_id: -1,
});

@Entity({ name: "permission" })
export default class Permission
    extends EditableContentModel
    implements PermissionAttributes
{
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
    @Column()
    public add_users!: boolean;
    @Column()
    public edit_users!: boolean;
    @Column()
    public delete_users!: boolean;

    public constructor(options?: Partial<PermissionAttributes>) {
        super();
        Object.assign(
            this,
            AttributeFactory(options, EmptyPermissionAttributes)
        );
    }
}
