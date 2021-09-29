import { Entity, Column } from "typeorm";
import BaseModel, { AttributeFactory } from "./abstract/base_model";

export interface DepartmentAttributes {
    name: string;
    business_id: number;
    prevent_delete: boolean;
    prevent_edit: boolean;
    updated_by_user_id: number;
}

export const EmptyDeparmentAttributes = (): DepartmentAttributes => ({
    name: "",
    business_id: -1,
    prevent_delete: false,
    prevent_edit: false,
    updated_by_user_id: -1,
});

@Entity({ name: "department" })
export default class Department
    extends BaseModel
    implements DepartmentAttributes
{
    @Column()
    public name!: string;
    @Column()
    public business_id!: number;
    @Column()
    public prevent_edit!: boolean;
    @Column()
    public prevent_delete!: boolean;
    @Column()
    public updated_by_user_id!: number;

    public constructor(options?: Partial<DepartmentAttributes>) {
        super();
        Object.assign(
            this,
            AttributeFactory(options, EmptyDeparmentAttributes)
        );
    }
}
