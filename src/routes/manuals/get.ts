import Department from "@models/department";
import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { isJson } from "@util/obj";
import { Request, Response } from "express";

const filterFields = ["department", "role"] as const;
type FilterKey = typeof filterFields[number];

const sortFields = ["title"] as const;
type SortFieldKey = typeof sortFields[number];

const sortOrders = ["ASC", "DESC"] as const;
type SortOrderKey = typeof sortOrders[number];

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

    if (limit && (isNaN(Number(limit)) || !/^\d+$/.test(limit as string))) {
        res.status(400).send("Invalid pagination options");
        return;
    }

    if (page && (isNaN(Number(page)) || !/^\d+$/.test(page as string))) {
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

    //  3.  Perform action
    let query = dbConnection
        .createQueryBuilder()
        .select(
            "m.id, m.title, m.published, m.prevent_delete, m.prevent_edit, m.created_on"
        )
        .distinct(true)
        .from(Manual, "m")
        // Joins are for filtering
        .leftJoin(ManualAssignment, "ma", "ma.manual_id = m.id")
        .leftJoin(UserRole, "ur", "ur.role_id = ma.role_id")
        .leftJoin(Role, "r", "r.id = ma.role_id")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("m.business_id = :current_business_id", {
            current_business_id,
        });

    if (!(isAdmin || isManager)) {
        query = query
            .andWhere("m.published = :published", { published: true })
            .andWhere("ur.user_id = :user_id", { user_id });
    }

    if (filter_field && filter_ids) {
        query = query.andWhere(
            `${(filter_field as string)[0]}.id IN (:...ids)`,
            { ids: filter_ids }
        );
    }

    if (search) {
        const sqlizedSearchItem = `%${search}%`;
        query = query.andWhere("m.title like :manual", {
            manual: sqlizedSearchItem,
        });
    }

    query = query.orderBy(
        sort_field ? `m.${sort_field}` : "m.created_on",
        (sort_order as SortOrderKey) ?? "DESC"
    );

    const count = await query.getCount();

    if (page && limit) {
        query = query
            .limit(Number(limit))
            .offset(Number(page) * Number(limit) - Number(limit));
    }

    const data = await query.getRawMany();
    res.status(200).send({
        data: data.map((d) => ({
            ...d,
            prevent_edit: d.prevent_edit === 1,
            prevent_delete: d.prevent_delete === 1,
            published: d.published === 1,
        })),
        count,
    });
    return;
};

export default getController;
