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
