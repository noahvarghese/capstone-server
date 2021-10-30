import { Column, Entity, PrimaryColumn } from "typeorm";
import { AttributeFactory } from "./abstract/base_model";
import EventDates from "./abstract/event_dates";

export interface MembershipAttributes {
    user_id: number | null;
    business_id: number | null;
    updated_by_user_id: number | null;
    default: boolean;
}

export const EmptyMembershipAttributes = (): MembershipAttributes => ({
    user_id: -1,
    business_id: -1,
    updated_by_user_id: null,
    default: false,
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
    @Column({ nullable: true, type: "int" })
    public updated_by_user_id!: number | null;
    @Column({ name: "default_option" })
    public default!: boolean;

    public constructor(options?: Partial<MembershipAttributes>) {
        super();
        Object.assign(
            this,
            AttributeFactory(options, EmptyMembershipAttributes)
        );
    }
}
