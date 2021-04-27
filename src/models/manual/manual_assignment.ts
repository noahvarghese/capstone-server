import { Entity, Column } from "typeorm";
import PrimaryKey from "../abstract/base_model";

interface ManualAssignmentAttributes {
    title: string;
    role_id: number;
    department_id: number;
    manual_id: number;
    updated_by_user_id: number;
}

const EmptyManualAssignmentAttributes = (): ManualAssignmentAttributes => ({
    title: "",
    department_id: -1,
    role_id: -1,
    manual_id: -1,
    updated_by_user_id: -1,
});

const ManualAssignmentBuilder = <T extends Partial<ManualAssignmentAttributes>>(
    options?: T
): ManualAssignmentAttributes & T =>
    Object.assign(EmptyManualAssignmentAttributes(), options);

@Entity()
export default class ManualAssignment
    extends PrimaryKey
    implements ManualAssignmentAttributes {
    @Column()
    public title!: string;
    @Column()
    public manual_id!: number;
    @Column()
    public role_id!: number;
    @Column()
    public department_id!: number;
    @Column()
    public updated_by_user_id!: number;

    public constructor(options?: Partial<ManualAssignmentAttributes>) {
        super();
        const attr = ManualAssignmentBuilder(options);
        Object.assign(this, attr);
    }
}
