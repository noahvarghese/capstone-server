import ManualAssignment from "@models/manual/assignment";
import Manual from "@models/manual/manual";
import QuizAttempt from "@models/quiz/attempt";
import Quiz from "@models/quiz/quiz";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { isJson } from "@util/obj";
import { Request, Response } from "express";
import { Brackets, WhereExpressionBuilder } from "typeorm";

const filterFields = ["user", "quiz"] as const;

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
            complete,
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

    // TODO: Retrieve all user/quiz combos, aggregate number of attempts per user/quiz

    let query = await dbConnection
        .createQueryBuilder()
        .select(
            "u.id AS u_id, u.first_name, u.last_name, q.id as q_id, q.title"
        )
        .addSelect(
            "COUNT(CASE WHEN qa.user_id = u.id THEN 1 END) AS number_of_attempts"
        )
        .from(User, "u")
        .leftJoin(UserRole, "ur", "ur.user_id = u.id")
        .leftJoin(ManualAssignment, "ma", "ma.role_id = ur.role_id")
        .leftJoin(Manual, "m", "m.id = ma.manual_id")
        .leftJoin(Quiz, "q", "q.manual_id = m.id")
        .leftJoin(QuizAttempt, "qa", "qa.quiz_id = q.id")
        .andWhere("m.published = :mPub", { mPub: true })
        .andWhere("q.published = :qPub", { qPub: true })
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
                    .orWhere("q.title like :title", {
                        title: sqlizedSearchItem,
                    });
            })
        );
    }

    query = query.groupBy("u.id, q.id");

    if (complete !== undefined) {
        query = query.having(
            `COUNT(qa.id) ${complete === "true" ? ">" : "="} 0`
        );
    }

    query = query.orderBy(
        sort_field
            ? sort_field === "title"
                ? "q.title"
                : `u.${sort_field}`
            : "q.created_on",
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
        first_name: string;
        last_name: string;
        title: string;
        q_id: number;
        number_of_attempts: number;
    }>();

    const data = result.map(
        ({ first_name, last_name, title, number_of_attempts, ...r }) => ({
            user_id: r.u_id,
            quiz_id: r.q_id,
            first_name,
            last_name,
            title,
            number_of_attempts,
        })
    );

    res.status(200).send({ data, count });
};

export default getController;
