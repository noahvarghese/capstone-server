import Logs from "./logs/logs";
import { emptyChecker, isPostalCode } from "./validators";

describe("postal code", () => {
    test("too short", () => {
        const valid = isPostalCode("A");
        expect(valid).toBe(false);
    });

    test("Incorrect order", () => {
        const valid = isPostalCode("1A12B3");
        expect(valid).toBe(false);
    });

    test("Valid", () => {
        const valid = isPostalCode("L5V 2A4");
        expect(valid).toBe(true);
    });

    test("No space should be valid", () => {
        const valid = isPostalCode("L5V2A4");
        expect(valid).toBe(true);
    });
});

describe("empty checker", () => {
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
            const res = emptyChecker({ test: { value, required } });
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
            const res = emptyChecker({ test: { value, required } });
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
