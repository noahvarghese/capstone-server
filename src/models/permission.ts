import { Entity, Column } from "typeorm";
import EditableContentModel from "./abstract/editable_content_model";

interface PermissionAttributes {
    view_users: boolean;
    edit_users: boolean;
    remove_users: boolean;
    edit_policies: boolean;
    updated_by_user_id: number;
}

const EmptyPermissionAttributes = (): PermissionAttributes => ({
    view_users: false,
    edit_users: false,
    remove_users: false,
    edit_policies: false,
    updated_by_user_id: -1,
});

const PermissionBuilder = <T extends Partial<PermissionAttributes>>(
    options?: T
): PermissionAttributes & T =>
    Object.assign(EmptyPermissionAttributes(), options);

@Entity()
export default class Permission
    extends EditableContentModel
    implements PermissionAttributes {
    @Column()
    public view_users!: boolean;
    @Column()
    public edit_users!: boolean;
    @Column()
    public remove_users!: boolean;
    @Column()
    public edit_policies!: boolean;

    public constructor(options?: Partial<PermissionAttributes>) {
        super();
        const attr = PermissionBuilder(options);
        Object.assign(this, attr);
    }
}
