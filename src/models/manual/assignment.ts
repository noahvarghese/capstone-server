import EventDates from "@models/abstract/event_dates";
import { Entity, Column, PrimaryColumn } from "typeorm";
import { AttributeFactory } from "../abstract/base_model";

export interface ManualAssignmentAttributes {
    role_id: number;
    manual_id: number;
    owner: boolean;
    updated_by_user_id: number;
}

export const EmptyManualAssignmentAttributes =
    (): ManualAssignmentAttributes => ({
        role_id: NaN,
        manual_id: NaN,
        owner: false,
        updated_by_user_id: NaN,
    });

@Entity({ name: "manual_assignment" })
export default class ManualAssignment
    extends EventDates
    implements ManualAssignmentAttributes
{
    @PrimaryColumn()
    public manual_id!: number;
    @PrimaryColumn()
    public role_id!: number;
    @Column()
    public owner!: boolean;
    @Column()
    public updated_by_user_id!: number;

    public constructor(options?: Partial<ManualAssignmentAttributes>) {
        super();
        Object.assign(
            this,
            AttributeFactory(options, EmptyManualAssignmentAttributes)
        );
    }
}
