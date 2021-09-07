import { Entity, Column } from "typeorm";
import EditableContentModel from "../abstract/editable_content_model";

export interface ManualAssignmentAttributes {
    role_id: number | null;
    department_id: number;
    manual_id: number;
    updated_by_user_id: number;
}

const EmptyManualAssignmentAttributes = (): ManualAssignmentAttributes => ({
    department_id: -1,
    role_id: -1,
    manual_id: -1,
    updated_by_user_id: -1,
});

const ManualAssignmentBuilder = <T extends Partial<ManualAssignmentAttributes>>(
    options?: T
): ManualAssignmentAttributes & T =>
    Object.assign(EmptyManualAssignmentAttributes(), options);

@Entity({ name: "manual_assignment" })
export default class ManualAssignment
    extends EditableContentModel
    implements ManualAssignmentAttributes
{
    @Column()
    public manual_id!: number;
    @Column({ nullable: true, type: "int" })
    public role_id!: number | null;
    @Column()
    public department_id!: number;

    public constructor(options?: Partial<ManualAssignmentAttributes>) {
        super();
        const attr = ManualAssignmentBuilder(options);
        Object.assign(this, attr);
    }
}
