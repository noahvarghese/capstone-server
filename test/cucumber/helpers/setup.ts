import api_attributes from "@test/sample_data/api/attributes";
import BaseWorld from "../support/base_world";
import dependencies, {
    ApiRoute,
    urls,
} from "@test/sample_data/api/dependencies";
import { getKey } from "./keytags";
import { submitForm } from "./submit_form";

export function loadBody<T>(
    this: BaseWorld,
    key: keyof typeof api_attributes
): void {
    const attributes = api_attributes[key]();
    this.setCustomProp<T>("body", attributes as T);
}

export async function setup(this: BaseWorld): Promise<void> {
    const tags = this.getTags();
    const keys = getKey<Array<keyof typeof dependencies>, typeof dependencies>(
        tags,
        "@setup_",
        dependencies,
        false
    );

    for (const key of keys) {
        const deps = dependencies[key];

        for (const dependency of deps) {
            loadBody.call(this, dependency as ApiRoute);
            try {
                await submitForm.call(
                    this,
                    urls[dependency as keyof typeof urls],
                    true,
                    true,
                    true
                );
            } catch (e) {
                console.error(`Error setting up dependency: ${dependency}`);
                throw e;
            }
        }
    }
}
