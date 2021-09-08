import { PhoneNumber, PhoneNumberUtil } from "google-libphonenumber";

// Only canadian postal codes
export const postalCodeValidator = (val: string): boolean =>
    /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(
        val
    );

export const phoneValidator = (val: string): boolean => {
    const phoneUtil = new PhoneNumberUtil();

    let phone: string | PhoneNumber = val;

    try {
        phone = phoneUtil.parseAndKeepRawInput(phone, "CA");

        return phoneUtil.isValidNumber(phone);
    } catch (e) {
        return false;
    }
};
