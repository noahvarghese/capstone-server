import { isPostalCode } from "./validators";

test("Postal code too short", () => {
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
