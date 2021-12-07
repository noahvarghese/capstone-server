import { registerBusiness } from "@test/api/attributes/business";
import { inviteMember } from "@test/api/attributes/member";
import DBConnection from "@test/support/db_connection";
import {
    emptyInviteUser,
    emptyRegisterBusinessProps,
    InviteMemberProps,
    RegisterBusinessProps,
} from ".";
import {
    registerAdminValidator,
    resetPasswordValidator,
    sendInviteValidator,
} from "./validators";

beforeAll(async () => {
    await DBConnection.init();
});
afterAll(async () => {
    await DBConnection.close(true);
});

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

describe("register new user and business", () => {
    const cases: [
        keyof RegisterBusinessProps,
        RegisterBusinessProps[keyof RegisterBusinessProps],
        RegExp
    ][] = [
        ["email", "invalid", /^invalid email/i],
        ["phone", "yolo", /^invalid phone number/i],
        ["postal_code", "123123", /^invalid postal code/i],
        ["password", "test", /^password must be at least 8 characters$/i],
        ["confirm_password", "thisdoesnotmatch", /^passwords do not match$/i],
    ];

    test.each(cases)("Invalid %p, value %p", async (field, value, error) => {
        const connection = await DBConnection.get();

        let errorMessage = "";
        try {
            const props = registerBusiness();
            props[field] = value;
            await registerAdminValidator(connection, props);
        } catch (e) {
            const { message } = e as Error;
            errorMessage = message;
        }
        expect(errorMessage).toMatch(error);
    });

    test("Empty values", async () => {
        const connection = await DBConnection.get();
        const keys = Object.keys(emptyRegisterBusinessProps());

        for (const key of keys) {
            let errorMessage = "";
            try {
                const props = registerBusiness();
                props[key as unknown as keyof RegisterBusinessProps] = "";
                await registerAdminValidator(connection, props);
            } catch (e) {
                const { message } = e as Error;
                errorMessage = message;
            }
            expect(errorMessage).toMatch(
                new RegExp(
                    `^${(key[0].toUpperCase() + key.substring(1))
                        .split("_")
                        .join(" ")} cannot be empty$`
                )
            );
        }
    });

    test("Valid inputs", async () => {
        const connection = await DBConnection.get();

        let errorMessage = "";
        try {
            const props = registerBusiness();
            await registerAdminValidator(connection, props);
        } catch (e) {
            const { message } = e as Error;
            errorMessage = message;
        }
        expect(errorMessage).toBe("");
    });
});

describe("invite user", () => {
    const cases: [
        keyof InviteMemberProps,
        InviteMemberProps[keyof InviteMemberProps],
        RegExp
    ][] = [
        ["email", "invalid", /^invalid email/i],
        ["phone", "yolo", /^invalid phone number/i],
    ];

    test.each(cases)("Invalid %p, value %p", (field, value, error) => {
        let errorMessage = "";
        try {
            const props = inviteMember();
            props[field] = value;
            sendInviteValidator(props);
        } catch (e) {
            const { message } = e as Error;
            errorMessage = message;
        }
        expect(errorMessage).toMatch(error);
    });

    test("Empty values", () => {
        const keys = Object.keys(emptyInviteUser());

        for (const key of keys) {
            let errorMessage = "";
            try {
                const props = inviteMember();
                props[key as unknown as keyof InviteMemberProps] = "";
                sendInviteValidator(props);
            } catch (e) {
                const { message } = e as Error;
                errorMessage = message;
            }
            expect(errorMessage).toMatch(
                new RegExp(
                    `^${(key[0].toUpperCase() + key.substring(1))
                        .split("_")
                        .join(" ")} cannot be empty$`
                )
            );
        }
    });

    test("Valid inputs, new user", async () => {
        let errorMessage = "";
        try {
            const props = inviteMember();
            sendInviteValidator(props);
        } catch (e) {
            const { message } = e as Error;
            errorMessage = message;
        }
        expect(errorMessage).toBe("");
    });
});
