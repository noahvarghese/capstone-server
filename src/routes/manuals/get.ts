import Department from "@models/department";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import { isJson } from "@util/obj";
import { Request, Response } from "express";
import { Connection, SelectQueryBuilder } from "typeorm";

const filterFields = ["department", "role"] as const;
type FilterKey = typeof filterFields[number];

const sortFields = ["title"] as const;
type SortFieldKey = typeof sortFields[number];

const sortOrders = ["ASC", "DESC"] as const;
type SortOrderKey = typeof sortOrders[number];

type ManualResponse = {
    id: number;
    title: string;
    published: boolean;
    prevent_delete: boolean;
    prevent_edit: boolean;
    editable_by_user: boolean;
};

type ManualGetter = (
    conn: Connection,
    business_id: number,
    user_id: number,
    query?: {
        search?: string;
        filter_ids?: number[];
        filter_field?: FilterKey;
        sort_field?: SortFieldKey;
        sort_order?: SortOrderKey;
        limit?: number;
        page?: number;
    }
) => Promise<ManualResponse[]>;

const executeFilterQuery = async (
    query: SelectQueryBuilder<ManualResponse>,
    options?: {
        search?: string;
        filter_ids?: number[];
        filter_field?: FilterKey;
        sort_field?: SortFieldKey;
        sort_order?: SortOrderKey;
        limit?: number;
        page?: number;
    }
): Promise<ManualResponse[]> => {
    if (!options) {
        return await query.getRawMany<ManualResponse>();
    }

    if (options.search) {
        const sqlizedSearchItem = `%${options.search}%`;
        query = query.andWhere("m.title like :manual", {
            manual: sqlizedSearchItem,
        });
    }

    query = query.orderBy(
        options.sort_field ? `m.${options.sort_field}` : "m.created_on",
        (options.sort_order as SortOrderKey) ?? "DESC"
    );

    if (options.page && options.limit) {
        query = query
            .limit(Number(options.limit))
            .offset(
                Number(options.page) * Number(options.limit) -
                    Number(options.limit)
            );
    }

    return await query.getRawMany<ManualResponse>();
};

const admin: ManualGetter = async (conn, business_id, _, query) => {
    return await executeFilterQuery(
        conn
            .createQueryBuilder()
            .select(
                "m.id, m.title, m.published, m.prevent_delete, m.prevent_edit"
            )
            .addSelect("1", "editable_by_user")
            .from(Manual, "m")
            .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
            .leftJoin(Role, "r", "r.id = ma.role_id")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .where("d.business_id = :business_id", {
                business_id,
            }) as unknown as SelectQueryBuilder<ManualResponse>,
        query
    );
};

const manager: ManualGetter = async (conn, business_id, user_id, query) => {
    return await executeFilterQuery(
        conn
            .createQueryBuilder()
            .select(
                "m.id, m.title, m.published, m.prevent_delete, m.prevent_edit"
            )
            .addSelect("1", "editable_by_user")
            .from(Manual, "m")
            .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
            .leftJoin(Role, "r", "r.id = ma.role_id")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .leftJoin(UserRole, "ur", "ur.role_id = r.id")
            .where("ur.user_id = :user_id", { user_id })
            .andWhere("r.access = :access", { access: "MANAGER" })
            .andWhere("d.business_id = :business_id", {
                business_id,
            }) as unknown as SelectQueryBuilder<ManualResponse>,
        query
    );
};

const user: ManualGetter = async (conn, business_id, user_id, query) => {
    return await executeFilterQuery(
        conn
            .createQueryBuilder()
            .select(
                "m.id, m.title, m.published, m.prevent_delete, m.prevent_edit"
            )
            .addSelect("0", "editable_by_user")
            .from(Manual, "m")
            .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
            .leftJoin(Role, "r", "r.id = ma.role_id")
            .leftJoin(Department, "d", "d.id = r.department_id")
            .leftJoin(UserRole, "ur", "ur.role_id = r.id")
            .where("ur.user_id = :user_id", { user_id })
            .andWhere("r.access = :access", { access: "USER" })
            .andWhere("m.published = :published", { published: true })
            .andWhere("d.business_id = :business_id", {
                business_id,
            }) as unknown as SelectQueryBuilder<ManualResponse>,
        query
    );
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

    // 1.   Check that url query items are correct
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

    // 2.   Check permissions
    const [isAdmin, isManager] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isAdmin(dbConnection, current_business_id!, user_id!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        User.isManager(dbConnection, current_business_id!, user_id!),
    ]);

    // 3.   Perform body of request
    const params: Parameters<ManualGetter> = [
        dbConnection,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        current_business_id!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        user_id!,
        {
            filter_field: filter_field as FilterKey,
            filter_ids,
            search: search as string,
            sort_field: sort_field as SortFieldKey,
            sort_order: sort_order as SortOrderKey,
            limit: limit ? Number(limit) : undefined,
            page: page ? Number(page) : undefined,
        },
    ];

    let result: ManualResponse[] = [];

    // i.   Get all manuals for business
    if (isAdmin) {
        result = await admin(...params);
    }
    // ii.   Get all manuals that user manages
    else if (isManager) {
        result = await manager(...params);
    }

    // iii. Since an admin has access to all manuals, and an admin cannot be a user or manager
    //      but managers may be users in other roles
    //      so we have to get user manuals as well for users and managers
    if (!isAdmin) {
        result = result.concat(await user(...params));
    }

    res.status(200).send(result);
    return;
};

export default getController;
