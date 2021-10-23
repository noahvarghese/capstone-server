import { snakeToCamel } from "@util/string";

/**
 * Compares dependecies keys to tags
 * Doesn't stop at first match, if a second match is found an error is thrown
 * That way I get notified if i accidentally set multiple tags
 * @param tags
 */
export const getKey = <
    S extends (keyof T & string) | (keyof T & string)[],
    T extends Record<string, unknown>
>(
    tags: string[],
    prefix: string,
    searchObject: T,
    stopAtOne: boolean
): S => {
    let key: string | string[];

    if (stopAtOne) key = "";
    else key = [];

    for (const tag of tags) {
        if (tag.startsWith(prefix)) {
            const dependencyName = snakeToCamel(
                tag.substring(prefix.length, tag.length)
            );

            if (Object.keys(searchObject).includes(dependencyName)) {
                if (stopAtOne) {
                    if (key !== "") {
                        throw new Error(
                            `Multiple keys found in Scenario tags: ${key}, ${dependencyName}`
                        );
                    }
                    key = dependencyName;
                } else {
                    (key as string[]).push(dependencyName);
                }
            }
        }
    }

    return key as S;
};
