import { Entity, Column } from "typeorm";
import BaseModel, { AttributeFactory } from "./abstract/base_model";

export interface BusinessAttributes {
    name: string;
    address: string;
    city: string;
    postal_code: string;
    province: string;
    country: string;
}

export const EmptyBusinessAttributes = (): BusinessAttributes => ({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    province: "",
    country: "",
});

@Entity({ name: "business" })
export default class Business extends BaseModel implements BusinessAttributes {
    @Column()
    public name!: string;
    @Column()
    public address!: string;
    @Column()
    public city!: string;
    @Column()
    public postal_code!: string;
    @Column()
    public province!: string;
    @Column()
    public country!: string;

    public constructor(options?: Partial<BusinessAttributes>) {
        super();
        Object.assign(this, AttributeFactory(options, EmptyBusinessAttributes));
    }
}
