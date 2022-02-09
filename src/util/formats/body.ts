import { ValidatorMap, Expected } from "@noahvarghese/get_j_opts";
import validator from "validator";
import { isPhone, isPostalCode } from ".";

/**
 * different types that will have their own format validators
 */
const bodyTypes = ["email", "postal_code", "province", "phone"] as const;
type BodyKey = typeof bodyTypes[number];
type BodyMap = ValidatorMap<BodyKey>;
export type ExpectedBody = Expected<BodyKey>;

export const bodyValidators: BodyMap = {
    email: (v: unknown) => validator.isEmail(v as string),
    phone: (v: unknown) => isPhone(v as string),
    postal_code: (v: unknown) => isPostalCode(v as string),
    province: (v: unknown) => (v as string).length === 2,
};
