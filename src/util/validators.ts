import { PhoneNumber, PhoneNumberUtil } from "google-libphonenumber";
import validator from "validator";
import DataServiceError, { ServiceErrorReasons } from "./errors/service";
import Logs from "./logs/logs";

// Only canadian postal codes
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

type EmptyMapperKey =
    | "string"
    | "number"
    | "undefined"
    | "boolean"
    | "object"
    | "function"
    | "bigint"
    | "symbol";

type EmptyMapper = {
    [x in EmptyMapperKey]: {
        validator: (v?: unknown) => boolean;
    };
};

const empty: EmptyMapper = {
    string: {
        validator: (v: unknown) =>
            !validator.isEmpty(v as string, { ignore_whitespace: true }),
    },
    number: {
        validator: (v: unknown) => !isNaN(Number(v)),
    },
    undefined: {
        validator: () => false,
    },
    boolean: {
        validator: (v: unknown) =>
            v !== undefined && (v === true || v === false),
    },
    function: {
        validator: (v: unknown) => {
            throw new Error(`Validator for function type not implemented ${v}`);
        },
    },
    object: {
        validator: (v: unknown) => {
            if (v === null) return false;
            const res =
                v &&
                Object.keys(v as Record<string, unknown>).length === 0 &&
                Object.getPrototypeOf(v) === Object.prototype;
            return !res;
        },
    },
    bigint: {
        validator: (v: unknown) => {
            throw new Error(`Validator for bigint type not implemented ${v}`);
        },
    },
    symbol: {
        validator: (v: unknown) => {
            throw new Error(`Validator for symbol type not implemented ${v}`);
        },
    },
};

type Expected = {
    [x: string]: {
        required: boolean;
        value: unknown;
    };
};

/**
 * Throws error with details that can be used to generate a response
 * @param obj
 */
export const emptyChecker = (
    obj: Expected
): undefined | { message: string; field: keyof typeof obj } => {
    for (const key of Object.keys(obj)) {
        const { value, required } = obj[key];
        const validatorFn = empty[typeof value].validator;

        try {
            const valid = validatorFn(value);

            if (required && !valid) {
                const message = `${key.replace(
                    "_",
                    " "
                )} cannot be empty, value -> ${value}, required -> ${required}`;
                return { message, field: key };
            }
        } catch (_e) {
            Logs.Error((_e as Error).message);
            throw new DataServiceError(ServiceErrorReasons.UTILITY);
        }
    }

    return undefined;
};
