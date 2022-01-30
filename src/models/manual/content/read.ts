import { Entity, PrimaryColumn } from "typeorm";
import { AttributeFactory } from "../../abstract/base_model";
import EventDates from "../../abstract/event_dates";

export interface ContentReadAttributes {
    user_id: number;
    content_id: number;
}

export const EmptyContentReadAttributes = (): ContentReadAttributes => ({
    user_id: NaN,
    content_id: NaN,
});

@Entity({ name: "content_read" })
export default class ContentRead 
    extends EventDates
    implements ContentReadAttributes
{
    @PrimaryColumn()
    public user_id!: number;
    @PrimaryColumn()
    public content_id!: number;

    public constructor(options?: Partial<ContentReadAttributes>) {
        super();
        Object.assign(
            this,
            AttributeFactory(options, EmptyContentReadAttributes)
        );
    }
}
