import { Entity, Column } from "typeorm";
import BaseModel from "./abstract/base_model";

interface BusinessAttributes {
    name: string;
    address: string;
    city: string;
    postal_code: string;
    province: string;
    country: string;
}

const EmptyBusiness = (): BusinessAttributes => ({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    province: "",
    country: "",
});

const BusinessBuilder = <T extends Partial<BusinessAttributes>>(
    options?: T
): BusinessAttributes & T => {
    return Object.assign(EmptyBusiness(), options);
};

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
        const businessAttr = BusinessBuilder(options);
        Object.assign(this, businessAttr);
    }
}
