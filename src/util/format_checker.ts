import { Expected, ValidatorMap } from "@noahvarghese/get_j_opts";
import { PhoneNumber, PhoneNumberUtil } from "google-libphonenumber";
import validator from "validator";

/**
 * different types that will have their own format validators
 */
const formatTypes = ["email", "postal_code", "province", "phone"] as const;
type FormatKey = typeof formatTypes[number];
type FormatMap = ValidatorMap<FormatKey>;
export type ExpectedFormat = Expected<FormatKey>;

/**
 * Only canadian postal codes
 */
export const isPostalCode = (val: string): boolean =>
    /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(
        val
    );

export const isPhone = (val: string, regionCode = "CA"): boolean => {
    const phoneUtil = new PhoneNumberUtil();

    let phone: string | PhoneNumber = val;

    try {
        phone = phoneUtil.parseAndKeepRawInput(phone, regionCode);

        return phoneUtil.isValidNumber(phone);
    } catch (e) {
        return false;
    }
};

export const formatValidators: FormatMap = {
    email: (v: unknown) => validator.isEmail(v as string),
    phone: (v: unknown) => isPhone(v as string),
    postal_code: (v: unknown) => isPostalCode(v as string),
    province: (v: unknown) => (v as string).length === 2,
};
