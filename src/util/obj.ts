export const deepClone = <T>(object: T): T =>
    JSON.parse(JSON.stringify(object)) as T;
