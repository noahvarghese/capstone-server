import BaseWorld from "@test/support/base_world";

export default class Request {
    public static failed(this: BaseWorld, include404 = false): void {
        const status = this.getCustomProp<number>("status");
        const cookies = this.getCustomProp<string | null>("cookies");

        expect(status.toString()).toMatch(/^[54]0/);
        if (include404 === false)
            expect(status.toString()).not.toMatch(/^404$/);
        expect(cookies).not.toBeTruthy();
    }

    public static succeeded(this: BaseWorld, auth = true): void {
        const cookies = this.getCustomProp<string | null>("cookies");
        const status = this.getCustomProp<number>("status");

        expect(status.toString()).toMatch(/^20/);
        if (auth) {
            expect(cookies).not.toBe(null);
            expect(cookies?.length).toBeGreaterThan(0);
        }
    }
}
