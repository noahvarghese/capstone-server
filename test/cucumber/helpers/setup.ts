import api_attributes from "@test/sample_data/api_attributes";
import BaseWorld from "../support/base_world";

export function loadAttributes<T>(
    this: BaseWorld,
    key: keyof typeof api_attributes
): void {
    const attributes = api_attributes[key]();
    this.setCustomProp<T>("body", attributes as unknown as T);
}
