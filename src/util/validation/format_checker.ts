import { PhoneNumber, PhoneNumberUtil } from "google-libphonenumber";
import validator from "validator";
import { ValidatorMap } from ".";

/**
 * different types that will have their own format validators
 */
export type FormatKey = "email" | "postal_code" | "province" | "phone";

export type FormatMap = ValidatorMap<FormatKey>;

export const formatValidators: FormatMap = {
    email: {
        validator: (v: unknown) => validator.isEmail(v as string),
    },
    phone: {
        validator: (v: unknown) => isPhone(v as string),
    },
    postal_code: {
        validator: (v: unknown) => isPostalCode(v as string),
    },
    province: {
        validator: (v: unknown) => (v as string).length === 2,
    },
};

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
