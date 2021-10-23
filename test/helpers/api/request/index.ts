import JestBaseWorld from "@test/support/base_world";

export function requestFailed(this: JestBaseWorld): void {
    const status = this.getCustomProp<number>("status");
    const cookies = this.getCustomProp<string | null>("cookies");

    expect(status.toString()).toMatch(/^[54]0/);
    expect(cookies).not.toBeTruthy();
}

export function requestSucceeded(this: JestBaseWorld): void {
    const cookies = this.getCustomProp<string | null>("cookies");
    const status = this.getCustomProp<number>("status");

    expect(status.toString()).toMatch(/^20/);
    expect(cookies).not.toBe(null);
    expect(cookies?.length).toBeGreaterThan(0);
}
