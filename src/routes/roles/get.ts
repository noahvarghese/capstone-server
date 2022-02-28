import Department from "@models/department";
import Role, { AccessKey } from "@models/role";
import User from "@models/user/user";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import { isJson } from "@util/obj";
import { Request, Response } from "express";
import { Brackets, WhereExpressionBuilder } from "typeorm";

const filterFields = ["department"] as const;

type FilterKey = typeof filterFields[number];

const sortFields = ["name", "num_members", "department_name"] as const;
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

    if (!(isAdmin || isManager)) {
        res.sendStatus(403);
        return;
    }

    let query = dbConnection
        .createQueryBuilder()
        .select("r.id", "id")
        .addSelect("r.name", "name")
        .addSelect("r.access", "access")
        .addSelect("d.name", "department_name")
        .addSelect("d.id", "department_id")
        .addSelect(
            "(SELECT COUNT(DISTINCT(ur.user_id)) FROM user_role ur JOIN role r2 ON r2.id = ur.role_id WHERE r2.id = r.id)",
            "num_members"
        )
        .from(Role, "r")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("d.business_id = :current_business_id", { current_business_id });

    if (filter_field && filter_ids) {
        query = query.andWhere(
            `${(filter_field as string)[0]}.id IN (:...ids)`,
            { ids: filter_ids }
        );
    }

    if (search) {
        const sqlizedSearchItem = `%${search}%`;
        query = query.andWhere(
            new Brackets((qb: WhereExpressionBuilder) => {
                qb.where("d.name like :department", {
                    department: sqlizedSearchItem,
                }).orWhere("r.name like :role", { role: sqlizedSearchItem });
            })
        );
    }

    query = query.orderBy(
        sort_field ? (sort_field as string) : "r.created_on",
        (sort_order as SortOrderKey) ?? "DESC"
    );

    if (page && limit) {
        query = query
            .limit(Number(limit))
            .offset(Number(page) * Number(limit) - Number(limit));
    }

    const result = await query.getRawMany<{
        id: number;
        name: string;
        access: AccessKey;
        department_id: number;
        department_name: string;
        num_members: number;
    }>();

    res.status(200).send(
        result.map(
            ({
                id,
                department_id,
                department_name,
                name,
                num_members,
                access,
            }) => ({
                id,
                name,
                access,
                num_members,
                department: { id: department_id, name: department_name },
            })
        )
    );
};

export default getController;
