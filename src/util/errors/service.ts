export enum ServiceErrorReasons {
    UTILITY,
    DATABASE,
    RESOURCE_LOCKED,
    PERMISSIONS,
    PARAMETERS_MISSING,
    NOT_AUTHENTICATED,
}

type ServiceErrorCodes = {
    [s in ServiceErrorReasons]: number;
};

const statusCode: ServiceErrorCodes = {
    [ServiceErrorReasons.DATABASE]: 500,
    [ServiceErrorReasons.UTILITY]: 500,
    [ServiceErrorReasons.PARAMETERS_MISSING]: 400,
    [ServiceErrorReasons.NOT_AUTHENTICATED]: 401,
    [ServiceErrorReasons.PERMISSIONS]: 403,
    [ServiceErrorReasons.RESOURCE_LOCKED]: 405,
};

export const dataServiceResponse = (s: ServiceErrorReasons): number =>
    statusCode[s];

export default class DataServiceError extends Error {
    private _reason: ServiceErrorReasons;
    get reason(): ServiceErrorReasons {
        return this._reason;
    }

    get code(): number {
        return dataServiceResponse(this.reason);
    }

    private _field?: string;
    get field(): string {
        return this._field ?? "";
    }

    constructor(message: string, reason: ServiceErrorReasons, field?: string) {
        super(message);
        this._reason = reason;
        this._field = field;
        Object.setPrototypeOf(this, Error.prototype);
    }
}
