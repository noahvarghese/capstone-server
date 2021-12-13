export enum ServiceErrorReasons {
    UTILITY_ERROR,
    DATABASE_ERROR,
    PARAMETERS_MISSING,
    NOT_AUTHENTICATED,
}

export default class DataServiceError extends Error {
    private _reason: ServiceErrorReasons;
    get reason(): ServiceErrorReasons {
        return this._reason;
    }

    private _field?: string;
    get field(): string {
        return this._field ?? "";
    }

    constructor(message: string, reason: ServiceErrorReasons, field?: string) {
        super(message);
        this._reason = reason;
        this._field = field;
        // Object.setPrototypeOf(this, Error.prototype);
    }
}

type ServiceErrorResponse = {
    [s in ServiceErrorReasons]: number;
};

const serviceResponse: ServiceErrorResponse = {
    "0": 500,
    "1": 500,
    "2": 400,
    "3": 401,
};

export const dataServiceResponse = (s: ServiceErrorReasons): number =>
    serviceResponse[s];
