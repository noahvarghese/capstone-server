import { resetPasswordValidator } from "./validators";

describe("Reset password", () => {
    test("Passwords do not match", async () => {
        let errorMessage = "";
        try {
            resetPasswordValidator("123123", "test1234", "test5678");
        } catch (e) {
            const { message } = e as Error;
            errorMessage = message;
        }
        expect(errorMessage).toMatch(/^passwords do not match$/i);
    });
    test("no token", async () => {
        let errorMessage = "";
        try {
            resetPasswordValidator("", "test1234", "test1234");
        } catch (e) {
            const { message } = e as Error;
            errorMessage = message;
        }
        expect(errorMessage).toMatch(/^no token provided$/i);
    });
});
