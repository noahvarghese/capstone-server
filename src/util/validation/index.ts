import validator from "validator";
import DataServiceError, { ServiceErrorReasons } from "../errors/service";
import Logs from "../logs/logs";
import { FormatKey, formatValidators } from "./format_checker";

export type ValidatorMap<T extends string> = {
    [x in T]: {
        validator: (v?: unknown) => boolean;
    };
};

type TypeKey =
    | "string"
    | "number"
    | "undefined"
    | "boolean"
    | "object"
    | "function"
    | "bigint"
    | "symbol";

type TypeMap = ValidatorMap<TypeKey>;

const typeValidators: TypeMap = {
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

export type Expected = {
    [x: string]: {
        required: boolean;
        value: unknown;
        format?: FormatKey;
    };
};

/**
 * Given the expectations checks that object values are correct
 * If incorrect throw error
 * If all correct return objects as T (rename func to parseObj)
 * @param obj
 */
export const validationChecker = (
    obj: Expected
): undefined | { message: string; field: keyof typeof obj } => {
    for (const key of Object.keys(obj)) {
        const { value, required, format } = obj[key];
        const validatorFn = typeValidators[typeof value].validator;

        try {
            let valid = validatorFn(value);

            if (required && !valid) {
                const message = `${key.replace("_", " ")} cannot be empty`;
                return { message, field: key };
            }

            if (valid && format) {
                valid = formatValidators[format].validator(value);
                if (!valid) {
                    const message = `${key.replace(
                        "_",
                        " "
                    )} is formatted incorrectly`;
                    return { message, field: key };
                }
            }
        } catch (_e) {
            Logs.Error((_e as Error).message);
            throw new DataServiceError(ServiceErrorReasons.UTILITY);
        }
    }

    return undefined;
};
