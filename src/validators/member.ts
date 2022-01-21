import {
    GetMembersOptions,
    MemberSortFields,
} from "@services/data/user/members";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import isInFactory, { SortDirection } from "@util/sortFieldFactory";
import { isPhone } from "@util/validators";
import validator from "validator";

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

export const updateMemberValidator = (
    id: number,
    {
        first_name,
        last_name,
        email,
        phone,
        birthday,
    }: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        birthday: string | undefined;
    }
): void => {
    if (isNaN(id)) {
        throw new DataServiceError(
            "First name cannot be empty",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "first_name"
        );
    }

    if (validator.isEmpty(first_name)) {
        throw new DataServiceError(
            "First name cannot be empty",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "first_name"
        );
    }

    if (validator.isEmpty(last_name)) {
        throw new DataServiceError(
            "Last name cannot be empty",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "last_name"
        );
    }

    if (validator.isEmail(email) === false) {
        throw new DataServiceError(
            "Invalid email",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "email"
        );
    }

    if (!isPhone(phone)) {
        throw new DataServiceError(
            "Invalid phone number",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "phone"
        );
    }

    // Allowed to be blank
    if (birthday && isNaN(Date.parse(birthday))) {
        throw new DataServiceError(
            "Invalid birthday",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "birthday"
        );
    }
};
