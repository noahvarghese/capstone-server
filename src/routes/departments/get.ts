import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import User from "@models/user/user";
import { Request, Response } from "express";
import { Brackets, WhereExpressionBuilder } from "typeorm";
import Department from "@models/department";
import Role from "@models/role";
import UserRole from "@models/user/user_role";

const sortFields = [
    "name",
    "num_members",
    "num_managers",
    "num_roles",
] as const;
export type SortFieldKey = typeof sortFields[number];

const sortOrders = ["ASC", "DESC"] as const;
export type SortOrderKey = typeof sortOrders[number];

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        query: { search, sort_order, sort_field, limit, page },
        session: { user_id, current_business_id },
        dbConnection,
    } = req;

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
        res.status(400).send("Mismatched pagination options");
        return;
    }

    if (limit && !isNumber(Number(limit))) {
        res.status(400).send("Invalid pagination option: limit");
        return;
    }

    if (page && !isNumber(Number(page))) {
        res.status(400).send("Invalid pagination option: page");
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
        .select("d.name", "name")
        .distinct(true)
        .addSelect("d.id", "id")
        .addSelect(
            "(SELECT COUNT(DISTINCT(ur.user_id)) FROM user_role ur JOIN role r ON r.id = ur.role_id JOIN department d2 ON d2.id = r.department_id WHERE r.access = 'MANAGER' AND d2.id = d.id)",
            "num_managers"
        )
        .addSelect(
            "(SELECT COUNT(DISTINCT(ur.user_id)) FROM user_role ur JOIN role r ON r.id = ur.role_id JOIN department d2 ON d2.id = r.department_id WHERE d2.id = d.id)",
            "num_members"
        )
        .addSelect(
            "(SELECT COUNT(DISTINCT(r.id)) FROM role r JOIN department d2 ON d2.id = r.department_id WHERE d2.id = d.id)",
            "num_roles"
        )
        .from(Department, "d")
        .leftJoin(Role, "r", "r.department_id = d.id")
        .leftJoin(UserRole, "ur", "ur.role_id = r.id")
        .where("d.business_id = :current_business_id", {
            current_business_id,
        });

    if (search) {
        const sqlizedSearchItem = `%${search}%`;
        query = query.andWhere(
            new Brackets((qb: WhereExpressionBuilder) => {
                qb.where("d.name like :department", {
                    department: sqlizedSearchItem,
                });
            })
        );
    }

    query = query.orderBy(
        sort_field ? (sort_field as string) : "d.created_on",
        (sort_order as SortOrderKey) ?? "DESC"
    );

    if (page && limit) {
        query = query
            .limit(Number(limit))
            .offset(Number(page) * Number(limit) - Number(limit));
    }

    const result = await query.getRawMany();

    res.status(200).send(result);
    return;
};

export default getController;
