import { PrimaryGeneratedColumn } from "typeorm";
import EventDates from "./event_dates";

export default abstract class BaseModel extends EventDates {
    @PrimaryGeneratedColumn()
    public id!: number;
}

export const AttributeFactory = <X>(
    options: Partial<X> = {},
    EmptyAttributeBuilder: () => X
): X => Object.assign(EmptyAttributeBuilder(), options);
