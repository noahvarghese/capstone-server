import Business from "@models/business";
import Department from "@models/department";
import Membership from "@models/membership";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { Request, Response } from "express";
import { Brackets, WhereExpressionBuilder } from "typeorm";

const filterFields = ["department", "role"] as const;

type FilterKey = typeof filterFields[number];

const sortFields = [
    "department",
    "role",
    "first_name",
    "last_name",
    "email",
    "phone",
] as const;
type SortFieldKey = typeof sortFields[number];

const sortOrders = ["ASC", "DESC"] as const;
type SortOrderKey = typeof sortOrders[number];

type Members = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    birthday?: Date;
    status: boolean;
    roles: {
        name: string;
        id: number;
        department: { name: string; id: number };
    }[];
}[];

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        query: {
            filter_ids,
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

    if (limit && isNaN(Number(limit))) {
        res.status(400).send("Invalid pagination options");
        return;
    }

    if (page && isNaN(Number(page))) {
        res.status(400).send("Invalid pagination options");
        return;
    }

    const [isAdmin, isManager] = await Promise.all([
        await User.isAdmin(
            dbConnection,
            current_business_id ?? NaN,
            user_id ?? NaN
        ),
        await User.isManager(
            dbConnection,
            current_business_id ?? NaN,
            user_id ?? NaN
        ),
    ]);

    if (!(isAdmin || isManager)) {
        res.sendStatus(403);
        return;
    }

    let query = dbConnection
        .createQueryBuilder()
        .select()
        .from(Business, "b")
        .leftJoin(Membership, "m", "m.business_id = b.id")
        .leftJoin(User, "u", "m.user_id = u.id")
        .leftJoin(UserRole, "ur", "ur.user_id = u.id")
        .leftJoin(Role, "r", "ur.role_id = r.id")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("b.id = :business_id", { business_id: current_business_id });

    if (filter_field && filter_ids) {
        query = query.andWhere(
            `${(filter_field as string)[0]}.id IN (:...ids)`,
            Array.from(filter_ids as string)
        );
    }

    if (search) {
        const sqlizedSearchItem = `%${search}%`;
        query = query.andWhere(
            new Brackets((qb: WhereExpressionBuilder) => {
                qb.where("r.name like :role_name", {
                    role_name: sqlizedSearchItem,
                }).orWhere("d.name like :department_name", {
                    department_name: sqlizedSearchItem,
                });
            })
        );
    }

    const memberResult = await query
        .orderBy(
            sort_field === "department"
                ? "d.name"
                : sort_field === "role"
                ? "r.name"
                : sort_field
                ? `u.${sort_field}`
                : "m.created_on",
            (sort_order as SortOrderKey) ?? "DESC"
        )
        .getRawMany();

    const members: Members = memberResult.reduce((prev, curr) => {
        const el = (prev as Members).find((e) => {
            e.id === curr.u_id;
        });

        if (!el) {
            prev.push({
                id: curr.u_id,
                first_name: curr.u_first_name,
                last_name: curr.u_last_name,
                email: curr.u_email,
                phone: curr.u_phone,
                birthday: curr.u_birthday,
                status: true,
                roles:
                    curr.r_id && curr.r_name
                        ? [
                              {
                                  id: curr.r_id,
                                  name: curr.r_name,
                                  department: {
                                      id: curr.d_id,
                                      name: curr.d_name,
                                  },
                              },
                          ]
                        : [],
            } as Members[keyof Members]);
        } else {
            el.roles.push({
                id: curr.r_id,
                name: curr.r_name,
                department: {
                    id: curr.d_id,
                    name: curr.d_name,
                },
            });
        }

        return prev;
    }, [] as Members);

    res.status(200).send(members);
    return;
};

export default getController;
