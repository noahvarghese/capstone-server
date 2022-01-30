import { Entity, Column } from "typeorm";
import { AttributeFactory } from "../abstract/base_model";
import EditableContentModel from "../abstract/editable_content_model";

export interface ManualAssignmentAttributes {
    role_id: number | null;
    department_id: number | null;
    manual_id: number;
    updated_by_user_id: number;
}

export const EmptyManualAssignmentAttributes =
    (): ManualAssignmentAttributes => ({
        department_id: NaN,
        role_id: NaN,
        manual_id: NaN,
        updated_by_user_id: NaN,
    });

@Entity({ name: "manual_assignment" })
export default class ManualAssignment
    extends EditableContentModel
    implements ManualAssignmentAttributes
{
    @Column()
    public manual_id!: number;
    @Column({ nullable: true, type: "int" })
    public role_id!: number | null;
    @Column({ nullable: true, type: "int" })
    public department_id!: number | null;

    public constructor(options?: Partial<ManualAssignmentAttributes>) {
        super();
        Object.assign(
            this,
            AttributeFactory(options, EmptyManualAssignmentAttributes)
        );
    }
}
