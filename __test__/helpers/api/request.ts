import BaseWorld from "@test/support/base_world";

export default class Request {
    public static failed(this: BaseWorld): void {
        const status = this.getCustomProp<number>("status");
        const cookies = this.getCustomProp<string | null>("cookies");

        expect(status.toString()).toMatch(/^[54]0/);
        expect(cookies).not.toBeTruthy();
    }

    public static succeeded(this: BaseWorld): void {
        const cookies = this.getCustomProp<string | null>("cookies");
        const status = this.getCustomProp<number>("status");

        expect(status.toString()).toMatch(/^20/);
        expect(cookies).not.toBe(null);
        expect(cookies?.length).toBeGreaterThan(0);
    }
}
