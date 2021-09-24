export const snakeToCamel = (start: string): string => {
    if (start === "" || start.trim() === "") {
        throw new Error("Empty string passed");
    }
    let final = "";
    const pieces = start.split("_");
    for (let i = 0; i < pieces.length; i++) {
        let piece = pieces[i];

        if (i > 0) {
            piece = piece[0].toUpperCase() + piece.substring(1);
        }

        final += piece;
    }

    return final;
};

export const snakeToPascal = (start: string): string => {
    if (start === "" || start.trim() === "") {
        throw new Error("Empty string passed");
    }

    let final = "";
    const pieces = start.split("_");

    for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];

        if (piece.length === 1) {
            final += piece.toUpperCase();
        } else {
            final += piece[0].toUpperCase() + piece.substring(1);
        }
    }

    return final;
};

export const pascalToCamel = (start: string): string => {
    if (start === "" || start.trim() === "") {
        throw new Error("Empty string passed");
    }

    let final = "";

    if (start.length === 1) {
        final = start.toLowerCase();
    } else {
        final = start[0].toLowerCase() + start.substring(1);
    }

    return final;
};

export const pascalToSnake = (start: string): string => {
    if (start === "" || start.trim() === "") {
        throw new Error("Empty string passed");
    }

    let final = "";

    const pieces = start.split(/(?=[A-Z])|(?<=[A-Z])/);

    if (pieces.length === 1) return start.toLowerCase();
    for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];

        // the first is always lowercase
        if (i === 0) {
            final += piece.toLowerCase();
            continue;
        }

        // anything after the first,
        // and that is not the last
        // prepend an underscore '_'
        if (i > 0 && i < pieces.length - 1) final += "_";

        // if a capital is found
        if (piece.length === 1 && piece.toUpperCase() === piece) {
            final += piece.toLowerCase();

            const j = i + 1;
            // prevents array out of bounds
            if (j < pieces.length) {
                // checks to make sure that there are no capitals
                if (pieces[j].toUpperCase() !== pieces[j]) {
                    final += pieces[j];
                    i++;
                }
            }
        }
    }

    return final;
};

export const camelToPascal = (start: string): string => {
    if (start === "" || start.trim() === "") {
        throw new Error("Empty string passed");
    }

    if (start.length === 1) {
        return start.toUpperCase();
    } else {
        return start[0].toUpperCase() + start.substring(1);
    }
};

export const camelToSnake = (start: string): string => {
    if (start === "" || start.trim() === "") {
        throw new Error("Empty string passed");
    }

    let final = "";

    const pieces = start.split(/(?=[A-Z])|(?<=[A-Z])/);

    if (pieces.length === 1) return start.toLowerCase();

    for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];

        // the first is always lowercase
        if (i === 0) {
            final += piece;
            continue;
        }

        // anything after the first,
        // and that is not the last
        // prepend an underscore '_'
        if (i > 0 && i < pieces.length - 1) final += "_";

        // if a capital is found
        if (piece.length === 1 && piece.toUpperCase() === piece) {
            final += piece.toLowerCase();

            const j = i + 1;
            // prevents array out of bounds
            if (j < pieces.length) {
                // checks to make sure that there are no capitals
                if (pieces[j].toUpperCase() !== pieces[j]) {
                    final += pieces[j];
                    i++;
                }
            }
        }
    }

    return final;
};

const formatMatrix: {
    [o in FormatType]: { [i in FormatType]: (str: string) => string };
} = {
    snake_case: {
        camelCase: snakeToCamel,
        PascalCase: snakeToPascal,
        snake_case: (str: string) => str,
    },
    camelCase: {
        snake_case: camelToSnake,
        PascalCase: camelToPascal,
        camelCase: (str: string) => str,
    },
    PascalCase: {
        snake_case: pascalToSnake,
        camelCase: pascalToCamel,
        PascalCase: (str: string) => str,
    },
};
export const formatter = (
    startingType: FormatType,
    data: string,
    desiredType: FormatType
): string => {
    if (startingType === desiredType) return data;
    else {
        const formatFunction = formatMatrix[startingType][desiredType];
        return formatFunction(data);
    }
};

export const checkType = (key: string): FormatType => {
    if (key === "" || key.trim() === "") {
        throw new Error("Empty string passed");
    }

    if (key.split("_").length > 1) {
        return "snake_case";
    }

    const keyParts = key.split(/(?=[A-Z])|(?<=[A-Z])/);

    if (keyParts[0][0].toUpperCase() === keyParts[0][0]) {
        return "PascalCase";
    } else {
        return "camelCase";
    }
};

export type FormatType = "snake_case" | "camelCase" | "PascalCase";
