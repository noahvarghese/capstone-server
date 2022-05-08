import ManualAssignment from "@models/manual/assignment";
import Content from "@models/manual/content/content";
import ContentRead from "@models/manual/content/read";
import Manual from "@models/manual/manual";
import ManualSection from "@models/manual/section";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { isJson } from "@util/obj";
import { Request, Response } from "express";
import { Brackets, WhereExpressionBuilder } from "typeorm";

const filterFields = ["user", "manual"] as const;

type FilterKey = typeof filterFields[number];

const sortFields = ["first_name", "last_name", "title"] as const;
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
            read,
        },
        session: { user_id, current_business_id },
        dbConnection,
    } = req;

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

    let query = dbConnection
        .createQueryBuilder()
        .select(
            "u.id AS u_id, u.first_name, u.last_name, m.id AS m_id, m.title"
        )
        .addSelect("COUNT(c.id) AS total_contents")
        .addSelect(
            "COUNT(CASE WHEN cr.user_id IS NOT NULL THEN 1 END) AS contents_read"
        )
        .from(User, "u")
        .leftJoin(UserRole, "ur", "ur.user_id = u.id")
        .leftJoin(ManualAssignment, "ma", "ma.role_id = ur.role_id")
        .leftJoin(Manual, "m", "m.id = ma.manual_id")
        .leftJoin(ManualSection, "ms", "ms.manual_id = m.id")
        .leftJoin(Content, "c", "c.manual_section_id = ms.id")
        .leftJoin(ContentRead, "cr", "cr.content_id = c.id")
        .where("m.published = :published", { published: true })
        .andWhere("m.business_id = :current_business_id", {
            current_business_id,
        });

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
                qb.where("u.first_name like :first_name", {
                    first_name: sqlizedSearchItem,
                })
                    .orWhere("u.last_name like :last_name", {
                        last_name: sqlizedSearchItem,
                    })
                    .orWhere("m.title like :title", {
                        title: sqlizedSearchItem,
                    });
            })
        );
    }

    query = query.groupBy("u.id, m.id");

    if (read !== undefined) {
        query = query.having(
            `COUNT(CASE WHEN cr.user_id IS NOT NULL THEN 1 END) ${
                read === "true" ? "=" : "<"
            } COUNT(c.id)`
        );
    }

    query = query.orderBy(
        sort_field
            ? sort_field === "title"
                ? "m.title"
                : `u.${sort_field}`
            : "m.created_on",
        (sort_order as SortOrderKey) ?? "DESC"
    );

    let count = -1;

    if (page && limit) {
        count = (await query.getRawMany()).length;

        query = query
            .limit(Number(limit))
            .offset(Number(page) * Number(limit) - Number(limit));
    }

    const result = await query.getRawMany<{
        u_id: number;
        m_id: number;
        first_name: string;
        last_name: string;
        title: string;
        total_contents: number;
        contents_read: number;
    }>();

    const data = result.map(
        ({
            first_name,
            last_name,
            title,
            total_contents,
            contents_read,
            ...r
        }) => ({
            user_id: r.u_id,
            manual_id: r.m_id,
            first_name,
            last_name,
            title,
            contents_read,
            total_contents,
        })
    );

    res.status(200).send({ data, count: count === -1 ? data.length : count });
};

export default getController;
