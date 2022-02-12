import { AccessKey } from "@models/role";
import User from "@models/user/user";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import { isJson } from "@util/obj";
import { Request, Response } from "express";

const filterFields = ["department", "role"] as const;

type FilterKey = typeof filterFields[number];

const sortFields = ["name", "role", "department"] as const;
type SortFieldKey = typeof sortFields[number];

const sortOrders = ["ASC", "DESC"] as const;
type SortOrderKey = typeof sortOrders[number];

type ManualResponse = {
    id: number;
    title: string;
    published: boolean;
    prevent_delete: boolean;
    prevent_edit: boolean;
};

type Handler = (query?: {
    search?: string;
    filter_ids?: number[];
}) => ManualResponse[];

const permissionHandler: { [x in AccessKey]: Handler } = {
    ADMIN: () => {
        return [];
    },
    MANAGER: () => {
        return [];
    },
    USER: () => {
        return [];
    },
};

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        query: {
            filter_ids: filterIds,
            filter_field,
            search,
            sort_order,
            sort_field,
            limit,
            page,
        },
        session: { user_id, current_business_id },
        dbConnection,
    } = req;

    const filter_ids = isJson(filterIds as string)
        ? JSON.parse(filterIds as string)
        : null;

    if ((filter_ids && !filter_field) || (!filter_ids && filter_field)) {
        res.status(400).send("Invalid filter options");
        return;
    }

    if (filter_ids) {
        if (
            !Array.isArray(filter_ids) ||
            (filter_ids as string[]).reduce((p, c) => {
                return p && isNaN(Number(c));
            }, true as boolean)
        ) {
            res.status(400).send("Invalid filter options");
            return;
        }
    }

    if (filter_field && !filterFields.includes(filter_field as FilterKey)) {
        res.status(400).send("Invalid filter options");
        return;
    }

    if ((sort_order && !sort_field) || (!sort_order && sort_field)) {
        res.status(400).send("Invalid sort options");
        return;
    }

    if (sort_order && !sortOrders.includes(sort_order as SortOrderKey)) {
        res.status(400).send("Invalid sort options");
        return;
    }

    if (sort_field && !sortFields.includes(sort_field as SortFieldKey)) {
        res.status(400).send("Invalid sort options");
        return;
    }

    if ((limit && !page) || (!limit && page)) {
        res.status(400).send("Invalid pagination options");
        return;
    }

    if (limit && !isNumber(limit)) {
        res.status(400).send("Invalid pagination options");
        return;
    }

    if (page && !isNumber(page)) {
        res.status(400).send("Invalid pagination options");
        return;
    }

    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, user_id!),
    ]);

    const access: AccessKey = isAdmin
        ? "ADMIN"
        : isManager
        ? "MANAGER"
        : "USER";

    const result = permissionHandler[access]({ search: search as string });

    res.status(200).send(result);
    return;
};

export default getController;
