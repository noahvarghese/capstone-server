import Logs from "@noahvarghese/logger";
import { Expected, validationChecker } from ".";

describe("validation checker, no formats", () => {
    describe("valid options", () => {
        const cases = [
            { value: "hi", required: true },
            { value: "hi", required: false },
            { value: "", required: false },
            { value: undefined, required: false },
            { value: null, required: false },
            { value: 1, required: true },
            { value: 1, required: false },
            { value: NaN, required: false },
            { value: true, required: true },
            { value: true, required: false },
            { value: false, required: true },
            { value: false, required: false },
            { value: {}, required: false },
            { value: { test: "123" }, required: true },
            { value: { test: "123" }, required: false },
            { value: { test: {} }, required: false },
            { value: { test: {} }, required: true },
        ];

        test.each(cases)("test %p", ({ value, required }) => {
            const res = validationChecker({ test: { value, required } });
            if (res)
                Logs.Error({
                    expected: "undefined",
                    received: "ERROR",
                    ...res,
                });
            expect(res).toBe(undefined);
        });
    });

    describe("invalid options", () => {
        const cases = [
            { value: "", required: true },
            { value: undefined, required: true },
            { value: null, required: true },
            { value: NaN, required: true },
            { value: {}, required: true },
        ];

        test.each(cases)("test %p", ({ value, required }) => {
            const res = validationChecker({ test: { value, required } });
            if (!res)
                Logs.Error({
                    expected: "ERROR",
                    received: "undefined",
                    value,
                    required,
                });
            expect(res).not.toBe(undefined);
        });
    });
});

describe("format checker", () => {
    describe("valid", () => {
        const cases: Expected[keyof Expected][] = [
            { value: "test@email.com", required: true, format: "email" },
            { value: "test@email.com", required: false, format: "email" },
            { value: "2898371245", required: true, format: "phone" },
            { value: "2898371245", required: false, format: "phone" },
            { value: "L6H4E1", required: true, format: "postal_code" },
            { value: "L6H4E1", required: false, format: "postal_code" },
            { value: "ON", required: true, format: "province" },
            { value: "ON", required: false, format: "province" },
        ];

        test.each(cases)("%p", ({ value, required, format }) => {
            expect(
                validationChecker({ test: { value, required, format } })
            ).toBe(undefined);
        });
    });

    describe("invalid", () => {
        const cases: Expected[keyof Expected][] = [
            { value: "email", required: true, format: "email" },
            { value: "email", required: false, format: "email" },
            { value: "phone", required: true, format: "phone" },
            { value: "phone", required: false, format: "phone" },
            { value: "postal_code", required: true, format: "postal_code" },
            { value: "postal_code", required: false, format: "postal_code" },
            { value: "province", required: true, format: "province" },
            { value: "province", required: false, format: "province" },
        ];

        test.each(cases)("%p", ({ value, required, format }) => {
            expect(
                validationChecker({ test: { value, required, format } })
            ).not.toBe(undefined);
        });
    });
});
