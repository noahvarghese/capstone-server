export enum ServiceErrorReasons {
    UTILITY_ERROR = "UTILITY_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    PARAMETERS_MISSING = "PARAMETERS_MISSING",
    NOT_AUTHENTICATED = "NOT_AUTHENTICATED",
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
    [ServiceErrorReasons.DATABASE_ERROR]: 500,
    [ServiceErrorReasons.UTILITY_ERROR]: 500,
    [ServiceErrorReasons.PARAMETERS_MISSING]: 400,
    [ServiceErrorReasons.NOT_AUTHENTICATED]: 401,
};

export const dataServiceResponse = (s: ServiceErrorReasons): number =>
    serviceResponse[s];
