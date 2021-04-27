/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const applyMixins = (
    derivedConstructor: any,
    baseConstructors: any[]
): void => {
    for (const baseConst of baseConstructors) {
        for (const name of Object.getOwnPropertyNames(baseConst.prototype)) {
            Object.defineProperty(
                derivedConstructor.prototype,
                name,
                Object.getOwnPropertyDescriptor(baseConst.prototype, name) ?? ""
            );
        }
    }
};
export default applyMixins;
