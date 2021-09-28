import { Entity, PrimaryColumn } from "typeorm";
import { AttributeFactory } from "../../abstract/base_model";
import EventDates from "../../abstract/event_dates";

export interface PolicyReadAttributes {
    user_id: number;
    policy_id: number;
}

export const EmptyPolicyReadAttributes = (): PolicyReadAttributes => ({
    user_id: -1,
    policy_id: -1,
});

@Entity({ name: "policy_read" })
export default class PolicyRead
    extends EventDates
    implements PolicyReadAttributes
{
    @PrimaryColumn()
    public user_id!: number;
    @PrimaryColumn()
    public policy_id!: number;

    public constructor(options?: Partial<PolicyReadAttributes>) {
        super();
        Object.assign(
            this,
            AttributeFactory(options, EmptyPolicyReadAttributes)
        );
    }
}
