import Business from "@models/business";
import User from "@models/user/user";
import DataServiceError from "@util/errors/service";
import ServiceError, { ServiceErrorReasons } from "@util/errors/service";
import isInFactory, { SortDirection } from "@util/sortFieldFactory";
import { emptyChecker, isPhone, isPostalCode } from "@util/validators";
import { getConnection } from "typeorm";
import validator from "validator";
import { emptyRegisterBusinessProps, RegisterBusinessProps } from ".";
import { GetMembersOptions, MemberSortFields } from "./members";
import { emptyInviteUser, InviteMemberProps } from "./members/invite";

export const sendInviteValidator = (props: InviteMemberProps): void => {
    const userInfo = Object.assign(emptyInviteUser(), props);
    const result = emptyChecker<InviteMemberProps>(userInfo);

    if (result) {
        throw new ServiceError(
            result.message,
            ServiceErrorReasons.PARAMETERS_MISSING,
            result.field
        );
    }

    const { email, phone } = props;

    if (validator.isEmail(email) === false) {
        throw new ServiceError(
            "Invalid email.",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "email"
        );
    }

    if (!isPhone(phone)) {
        throw new ServiceError(
            "Invalid phone number",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "phone"
        );
    }
};

export const forgotPasswordValidator = async (email: string): Promise<void> => {
    const connection = getConnection();

    const userCount = await connection.manager.count(User, {
        where: { email },
    });

    if (userCount !== 1) {
        throw new ServiceError(
            "Invalid email",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "email"
        );
    }
};

export const resetPasswordValidator = (
    token: string,
    password: string,
    confirmPassword: string
): void => {
    if (!token)
        throw new ServiceError(
            "No token provided",
            ServiceErrorReasons.NOT_AUTHENTICATED
        );
    if (password !== confirmPassword)
        throw new ServiceError(
            "Passwords do not match",
            ServiceErrorReasons.PARAMETERS_MISSING
        );
};

export const registerAdminValidator = async (
    props: RegisterBusinessProps
): Promise<void> => {
    // validation
    const result = emptyChecker<RegisterBusinessProps>(
        Object.assign(emptyRegisterBusinessProps(), props)
    );

    if (result) {
        throw new ServiceError(
            result.message,
            ServiceErrorReasons.PARAMETERS_MISSING,
            result.field
        );
    }

    // Validate that data is in the expected format
    if (validator.isEmail(props.email) === false) {
        throw new ServiceError(
            "Invalid email",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "email"
        );
    }
    if (!isPhone(props.phone)) {
        throw new ServiceError(
            "Invalid phone number",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "phone"
        );
    }
    if (!isPostalCode(props.postal_code)) {
        throw new ServiceError(
            "Invalid postal code",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "postal_code"
        );
    }
    if (props.password.length < 8) {
        throw new ServiceError(
            "Password must be at least 8 characters",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "password"
        );
    }
    if (props.password !== props.confirm_password) {
        throw new ServiceError(
            "Passwords do not match",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "password"
        );
    }

    const connection = getConnection();

    // more validation
    await Promise.race([
        connection.manager.find(Business, {
            where: { name: props.name },
        }),
        connection.manager.find(User, { where: { email: props.email } }),
    ]).then((res) => {
        if (res.length > 0) {
            throw new ServiceError(
                `${
                    res[0] instanceof Business ? "Business" : "User"
                } already exists`,
                ServiceErrorReasons.PARAMETERS_MISSING
            );
        }
        return;
    });
};

export const getMembersValidator = (opts: GetMembersOptions): void => {
    if (opts.sort) {
        const isSortField = isInFactory<MemberSortFields>([
            "birthday",
            "first_name",
            "last_name",
            "email",
            "phone",
        ]);
        const isSortOrder = isInFactory<SortDirection>(["ASC", "DESC"]);

        if (!isSortField(opts.sort.field)) {
            throw new DataServiceError(
                `Invalid field to sort by: ${opts.sort.field}`,
                ServiceErrorReasons.PARAMETERS_MISSING
            );
        }

        if (!isSortOrder(opts.sort.order)) {
            throw new DataServiceError(
                `Invalid option for sort order: ${opts.sort.order}`,
                ServiceErrorReasons.PARAMETERS_MISSING
            );
        }
    }

    if (opts.filter) {
        const isFilterField = isInFactory<"department" | "role">([
            "department",
            "role",
        ]);

        if (!isFilterField(opts.filter.field)) {
            throw new DataServiceError(
                `Invalid field to filter by: ${opts.filter.field}`,
                ServiceErrorReasons.PARAMETERS_MISSING
            );
        }

        if (!Array.isArray(opts.filter.ids)) {
            throw new DataServiceError(
                "Invalid filter ids",
                ServiceErrorReasons.PARAMETERS_MISSING
            );
        } else {
            if (opts.filter.ids.length < 1) {
                throw new DataServiceError(
                    "Invalid filter ids",
                    ServiceErrorReasons.PARAMETERS_MISSING
                );
            }

            opts.filter.ids.forEach((id) => {
                if (isNaN(Number(id))) {
                    throw new DataServiceError(
                        "Invalid filter ids",
                        ServiceErrorReasons.PARAMETERS_MISSING
                    );
                }
            });
        }
    }

    // Force set these
    opts.limit =
        isNaN(Number(opts.limit)) || Number(opts.limit) < 1
            ? 50
            : Number(opts.limit);

    opts.page =
        isNaN(Number(opts.page)) || Number(opts.page) < 1
            ? 1
            : Number(opts.page);

    opts.ids = Array.isArray(opts.ids) ? opts.ids : [];
};

export const getMemberValidator = (opts: {
    ids: number[];
    limit: number;
    page: number;
}): void => {
    if (opts.ids.length > 1)
        throw new DataServiceError(
            "Too many IDs",
            ServiceErrorReasons.PARAMETERS_MISSING
        );

    if (isNaN(opts.ids[0]))
        throw new DataServiceError(
            "Invalid id",
            ServiceErrorReasons.PARAMETERS_MISSING
        );
};

export const deleteMemberValidator = (id: number): void => {
    if (isNaN(id)) {
        throw new DataServiceError(
            "Invalid id",
            ServiceErrorReasons.PARAMETERS_MISSING
        );
    }
};

// export const updateMemberValidator = () => {};
