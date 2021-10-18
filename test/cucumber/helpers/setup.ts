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

    const completedDependencies: ApiRoute[] = [];

    for (const key of keys) {
        const deps = dependencies[key];

        for (const dependency of deps) {
            // prevent setting up multiple items
            if (completedDependencies.includes(dependency)) continue;
            else completedDependencies.push(dependency);

            loadBody.call(this, dependency as ApiRoute);
            try {
                const url = urls[dependency as keyof typeof urls];
                await submitForm.call(
                    this,
                    typeof url === "function" ? url("") : url,
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