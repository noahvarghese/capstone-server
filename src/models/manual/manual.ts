import { Entity, Column } from "typeorm";
import { AttributeFactory } from "../abstract/base_model";
import EditableContentModel from "../abstract/editable_content_model";

export interface ManualAttributes {
    title: string;
    role_id: number | null;
    department_id: number | null;
    prevent_delete: boolean;
    prevent_edit: boolean;
    updated_by_user_id: number;
}

export const EmptyManualAttributes = (): ManualAttributes => ({
    title: "",
    department_id: -1,
    role_id: -1,
    prevent_delete: false,
    prevent_edit: false,
    updated_by_user_id: -1,
});

@Entity({ name: "manual" })
export default class Manual
    extends EditableContentModel
    implements ManualAttributes
{
    @Column()
    public title!: string;
    @Column({ nullable: true, type: "int", unique: false })
    public department_id!: number | null;
    @Column({ nullable: true, type: "int", unique: false })
    public role_id!: number | null;
    @Column()
    public prevent_delete!: boolean;
    @Column()
    public prevent_edit!: boolean;

    public constructor(options?: Partial<ManualAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyManualAttributes));
    }
}
