import { deepClone } from "@util/obj";
import modelAttributes from "@test/model/attributes";
import BusinessKey from "../keys/business";
import { RegisterBusinessProps } from "@services/data/user";

const business = modelAttributes.business();
const user = modelAttributes.user();

export type GetBusinessesProps = undefined;
export type BusinessTypes = Record<
    BusinessKey,
    () => GetBusinessesProps | RegisterBusinessProps
>;

export const getBusinesses = (): GetBusinessesProps => undefined;
export const registerBusiness = (): RegisterBusinessProps =>
    deepClone({
        name: business.name,
        address: business.address,
        city: business.city,
        postal_code: business.postal_code,
        province: business.province,
        first_name: user.first_name,
        last_name: user.last_name,
        password: user.password,
        confirm_password: user.password,
        email: user.email,
        phone: user.phone,
    });

const attributes: BusinessTypes = {
    getBusinesses,
    registerBusiness,
};

export default attributes;
