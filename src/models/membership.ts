import { Column, Entity, PrimaryColumn } from "typeorm";
import { AttributeFactory } from "./abstract/base_model";
import EventDates from "./abstract/event_dates";

export interface MembershipAttributes {
    user_id: number | null;
    business_id: number | null;
    updated_by_user_id: number | null;
    default_option: boolean;
    prevent_delete: boolean;
}

export const EmptyMembershipAttributes = (): MembershipAttributes => ({
    user_id: NaN,
    business_id: NaN,
    updated_by_user_id: NaN,
    default_option: false,
    prevent_delete: false,
});

@Entity()
export default class Membership
    extends EventDates
    implements MembershipAttributes
{
    @PrimaryColumn()
    public user_id!: number;
    @PrimaryColumn()
    public business_id!: number;
    @Column()
    public updated_by_user_id!: number | null;
    @Column()
    public default_option!: boolean;
    @Column()
    public prevent_delete!: boolean;

    public constructor(options?: Partial<MembershipAttributes>) {
        super();
        Object.assign(
            this,
            AttributeFactory(options, EmptyMembershipAttributes)
        );
    }
}
