export type SortDirection = "ASC" | "DESC";

const isInFactory = <T>(fields: readonly T[]): ((val: T) => val is T) => {
    return (val: T): val is T => {
        return typeof val === "string" && fields.includes(val);
    };
};

export default isInFactory;
