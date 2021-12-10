import BaseWorld from "@test/support/base_world";

export default class Request {
    public static failed(
        this: BaseWorld,
        opts: {
            include404: boolean;
            status?: RegExp;
            message?: string | RegExp;
            checkCookie?: boolean;
        } = {
            include404: false,
        }
    ): void {
        const status = this.getCustomProp<number>("status");
        const message = this.getCustomProp<string>("message");
        const cookies = this.getCustomProp<string | null>("cookies");

        expect(status.toString()).toMatch(opts.status ?? /^[54]0/);
        if (opts.include404 === false)
            expect(status.toString()).not.toMatch(/^404$/);
        if (opts.checkCookie) expect(cookies).not.toBeTruthy();
        if (opts.message) expect(message).toMatch(opts.message);
    }

    /**
     *
     * @param this
     * @param opts The expected values to check for, whether the user was logged in after the api call finished, and what status code was returned
     */
    public static succeeded(
        this: BaseWorld,
        opts?: { auth: boolean; status?: RegExp }
    ): void {
        const cookies = this.getCustomProp<string | null>("cookies");
        const status = this.getCustomProp<number>("status");

        expect(status.toString()).toMatch(opts?.status ?? /^20/);
        if (opts?.auth) {
            expect(cookies).not.toBe(null);
            expect(cookies?.length).toBeGreaterThan(0);
        }
    }
}
