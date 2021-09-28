import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from "typeorm";
import { AttributeFactory } from "./abstract/base_model";

export interface EventAttributes {
    name: string;
    status: "PASS" | "FAIL";
    user_id: number | null;
    business_id: number | null;
}

export const EmptyEventAttributes = (): EventAttributes => ({
    name: "",
    status: "FAIL",
    user_id: null,
    business_id: null,
});

@Entity()
export default class Event implements EventAttributes {
    @PrimaryGeneratedColumn()
    public id!: number;
    @Column()
    public name!: string;
    @Column()
    public status!: "PASS" | "FAIL";
    @Column({ nullable: true })
    public user_id!: number;
    @Column({ nullable: true })
    public business_id!: number;
    @CreateDateColumn()
    public created_on!: Date;

    public constructor(options?: Partial<EventAttributes>) {
        Object.assign(this, AttributeFactory(options, EmptyEventAttributes));
    }
}
