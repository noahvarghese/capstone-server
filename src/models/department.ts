import { Entity, Column } from "typeorm";
import PrimaryKey from "./abstract/base_model";

interface DepartmentAttributes {
    name: string;
    business_id: number;
    updated_by_user_id: number;
}

const EmptyDeparmentAttributes = (): DepartmentAttributes => ({
    name: "",
    business_id: -1,
    updated_by_user_id: -1,
});

const DepartmentBuilder = <T extends Partial<DepartmentAttributes>>(
    options?: T
): DepartmentAttributes & T =>
    Object.assign(EmptyDeparmentAttributes(), options);

@Entity()
export default class Department
    extends PrimaryKey
    implements DepartmentAttributes {
    @Column()
    public name!: string;
    @Column()
    public business_id!: number;
    @Column()
    public updated_by_user_id!: number;

    public constructor(options?: Partial<DepartmentAttributes>) {
        super();
        const attr = DepartmentBuilder(options);
        Object.assign(this, attr);
    }
}
