import { Entity, PrimaryColumn } from "typeorm";
import EventDates from "../../abstract/event_dates";

export interface PolicyReadAttributes {
    user_id: number;
    policy_id: number;
}

const EmptyReadAttributes = (): PolicyReadAttributes => ({
    user_id: -1,
    policy_id: -1,
});

const ReadBuilder = <T extends Partial<PolicyReadAttributes>>(
    options?: T
): PolicyReadAttributes & T => Object.assign(EmptyReadAttributes(), options);

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
        const attr = ReadBuilder(options);
        Object.assign(this, attr);
    }
}
