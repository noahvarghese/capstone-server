import { Entity, Column } from "typeorm";
import BaseModel from "./abstract/base_model";

export interface BusinessAttributes {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postal_code: string;
    province: string;
    country: string;
    code: string;
}

const EmptyBusiness = (): BusinessAttributes => ({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postal_code: "",
    province: "",
    country: "",
    code: "",
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
    public phone!: string;
    @Column()
    public email!: string;
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
    @Column()
    public code!: string;

    public constructor(options?: Partial<BusinessAttributes>) {
        super();
        const businessAttr = BusinessBuilder(options);
        Object.assign(this, businessAttr);
    }

    public createCode = (): void => {
        // creates 'hash' that should be unique based off the name and phone number
        const phoneString = this.phone.toString();
        this.code =
            this.name.split(" ")[0].toUpperCase() +
            phoneString.substring(phoneString.length - 4);
    };
}
