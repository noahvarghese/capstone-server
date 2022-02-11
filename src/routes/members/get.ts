import Department from "@models/department";
import Membership from "@models/membership";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";
import { Brackets, WhereExpressionBuilder } from "typeorm";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import { isJson } from "@util/obj";

const filterFields = ["department", "role"] as const;

type FilterKey = typeof filterFields[number];

const sortFields = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "birthday",
] as const;
type SortFieldKey = typeof sortFields[number];

const sortOrders = ["ASC", "DESC"] as const;
type SortOrderKey = typeof sortOrders[number];

export type Member = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    birthday?: Date;
    accepted: boolean;
    roles: {
        name: string;
        id: number;
        department: { name: string; id: number };
    }[];
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
            accepted,
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

    try {
        const [isAdmin, isManager] = await Promise.all([
            User.isAdmin(
                dbConnection,
                current_business_id ?? NaN,
                user_id ?? NaN
            ),
            User.isManager(
                dbConnection,
                current_business_id ?? NaN,
                user_id ?? NaN
            ),
        ]);

        if (!(isAdmin || isManager)) {
            res.sendStatus(403);
            return;
        }
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
        return;
    }

    let query = dbConnection
        .createQueryBuilder()
        .select(
            "first_name, last_name, email, phone, birthday, m.user_id, accepted"
        )
        .from(User, "u")
        .leftJoin(Membership, "m", "m.user_id = u.id")
        .leftJoin(UserRole, "ur", "ur.user_id = u.id")
        .leftJoin(Role, "r", "ur.role_id = r.id")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("m.business_id = :business_id", {
            business_id: current_business_id,
        });

    if (
        accepted !== undefined &&
        (JSON.parse(accepted as string) === false ||
            JSON.parse(accepted as string) === true)
    ) {
        query = query.andWhere(
            "m.accepted = :accepted",
            JSON.parse(accepted as string)
        );
    }

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
                qb.where("u.birthday like :birthday", {
                    birthday: sqlizedSearchItem,
                })
                    .orWhere("u.first_name like :first_name", {
                        first_name: sqlizedSearchItem,
                    })
                    .orWhere("u.last_name like :last_name", {
                        last_name: sqlizedSearchItem,
                    })
                    .orWhere("u.email like :email", {
                        email: sqlizedSearchItem,
                    })
                    .orWhere("u.phone like :phone", {
                        phone: sqlizedSearchItem,
                    })
                    .orWhere("r.name like :role", { role: sqlizedSearchItem })
                    .orWhere("d.name like :department", {
                        department: sqlizedSearchItem,
                    });
            })
        );
    }

    query = query.orderBy(
        sort_field ? `u.${sort_field}` : "m.created_on",
        (sort_order as SortOrderKey) ?? "DESC"
    );

    if (page && limit) {
        query = query
            .limit(Number(limit))
            .offset(Number(page) * Number(limit) - Number(limit));
    }

    try {
        const memberResult = await query.getRawMany<{
            user_id: number;
            first_name: string;
            last_name: string;
            email: string;
            phone: string;
            birthday: Date | null;
            accepted: boolean;
        }>();

        const members = await Promise.all(
            memberResult.map(async (m) => {
                return {
                    id: m.user_id,
                    ...m,
                    roles: (
                        await dbConnection
                            .createQueryBuilder()
                            .select(
                                "r.id AS role_id, r.name AS role_name, d.id AS department_id, d.name AS department_name"
                            )
                            .from(UserRole, "ur")
                            .leftJoin(Role, "r", "r.id = ur.role_id")
                            .leftJoin(Department, "d", "d.id = r.department_id")
                            .where("ur.user_id = :user_id", { user_id })
                            .getRawMany<{
                                role_id: number;
                                role_name: string;
                                department_id: number;
                                department_name: string;
                            }>()
                    ).map((r) => ({
                        id: r.role_id,
                        name: r.role_name,
                        department: {
                            id: r.department_id,
                            name: r.department_name,
                        },
                    })),
                };
            })
        );
        res.status(200).send(members);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
        return;
    }
};

export default getController;
