import { isPhone, isPostalCode } from ".";

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

describe("phone (only canadian)", () => {
    test("647", () => {
        expect(isPhone("6473238954")).toBe(true);
    });

    test("905", () => {
        expect(isPhone("9053393294")).toBe(true);
    });

    test("289", () => {
        expect(isPhone("2898372436")).toBe(true);
    });

    test("416", () => {
        expect(isPhone("4168392343")).toBe(true);
    });

    test("no phone", () => {
        expect(isPhone("not a phone")).toBe(false);
    });
});
