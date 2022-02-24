export const deepClone = <T>(object: T): T =>
    JSON.parse(JSON.stringify(object)) as T;

export const isJson = (str: string): boolean => {
    try {
        JSON.parse(str);
    } catch (_e) {
        return false;
    }
    return true;
};
