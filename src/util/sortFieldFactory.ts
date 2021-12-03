const isSortFieldFactory = (
    fields: readonly string[]
): ((val: string) => boolean) => {
    type FieldType = typeof fields[number];
    return (val: string): val is FieldType => {
        return typeof val === "string" && fields.includes(val);
    };
};

export default isSortFieldFactory;
