import Department from "@models/department";
import Membership from "@models/membership";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import Logs from "@util/logs/logs";
import { SortDirection } from "@util/sortFieldFactory";
import {
    getConnection,
    Brackets,
    WhereExpressionBuilder,
    EntityManager,
} from "typeorm";

export interface ReadMember {
    user: {
        first_name: string;
        last_name: string;
        email: string;
        birthday?: Date | string | null;
        phone: string;
        id: number;
    };
    roles: {
        default: boolean;
        id: number;
        name: string;
        department: {
            id: number;
            name: string;
        };
    }[];
}

export type MemberSortFields = keyof Pick<
    User,
    "birthday" | "first_name" | "last_name" | "email" | "phone"
>;

export type GetMembersOptions = {
    ids?: number[];
    limit: number;
    page: number;
    search?: string;
    sort?: {
        field: MemberSortFields;
        order: SortDirection;
    };
    filter?: {
        field: "role" | "department";
        ids: number[];
    };
};

export const get = async (
    opts: GetMembersOptions,
    business_id: number
): Promise<ReadMember[]> => {
    const connection = getConnection();

    // common start of query
    let userQuery = connection
        .createQueryBuilder()
        .select([
            "u.id",
            "u.first_name",
            "u.last_name",
            "u.email",
            "u.phone",
            "u.birthday",
            "r.id",
            "ur.primary_role_for_user",
            "r.name",
            "d.id",
            "d.name",
        ])
        .from(User, "u")
        .where("m.business_id = :business_id", {
            business_id,
        });

    if (opts.search) {
        const search = `%${opts.search}%`;

        userQuery = userQuery.andWhere(
            new Brackets((qb: WhereExpressionBuilder) => {
                qb.where("u.birthday like :birthday", {
                    birthday: search,
                })
                    .orWhere("u.first_name like :first_name", {
                        first_name: search,
                    })
                    .orWhere("u.last_name like :last_name", {
                        last_name: search,
                    })
                    .orWhere("u.email like :email", {
                        email: search,
                    })
                    .orWhere("u.phone like :phone", {
                        phone: search,
                    })
                    .orWhere("r.name like :role", { role: search })
                    .orWhere("d.name like :department", {
                        department: search,
                    });
            })
        );
    }

    // only filter portion
    if (opts.filter) {
        userQuery = userQuery.andWhere(
            `${
                opts.filter.field === "department" ? "d.id" : "r.id"
            } IN (:...filter_ids)`,
            { filter_ids: opts.filter.ids }
        );
    }

    if (opts.ids && opts.ids.length > 0) {
        userQuery = userQuery.andWhere("u.id IN (:...ids)", {
            ids: opts.ids,
        });
    }

    // apply sorting and pagination
    userQuery = userQuery
        .leftJoin(Membership, "m", "m.user_id = u.id")
        .leftJoin(UserRole, "ur", "ur.user_id = u.id")
        .leftJoin(Role, "r", "r.id = ur.role_id")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .orderBy(
            opts.sort?.field ? `u.${opts.sort.field}` : "u.created_on",
            opts.sort?.order ?? "DESC"
        )
        .limit(opts.limit)
        .offset(opts.page * opts.limit - opts.limit);

    const users: {
        u_id: number;
        u_first_name: string;
        u_last_name: string;
        u_email: string;
        u_phone: string;
        u_birthday: Date | string | null;
        r_id: number;
        ur_primary_role_for_user: boolean;
        r_name: string;
        d_id: number;
        d_name: string;
    }[] = await userQuery.getRawMany();

    const response = users.reduce((newArray, currentVal) => {
        const index = newArray.findIndex(
            (val) => val.user.id === currentVal.u_id
        );

        if (index > -1) {
            newArray[index].roles.push({
                id: currentVal.r_id,
                name: currentVal.r_name,
                default: currentVal.ur_primary_role_for_user,
                department: {
                    id: currentVal.d_id,
                    name: currentVal.d_name,
                },
            });
            return newArray;
        }

        newArray.push({
            user: {
                id: currentVal.u_id,
                first_name: currentVal.u_first_name,
                last_name: currentVal.u_last_name,
                phone: currentVal.u_phone,
                email: currentVal.u_email,
                birthday:
                    currentVal.u_birthday === "0000-00-00 00:00:00"
                        ? null
                        : currentVal.u_birthday,
            },
            roles: [
                {
                    id: currentVal.r_id,
                    name: currentVal.r_name,
                    default: Boolean(currentVal.ur_primary_role_for_user),
                    department: {
                        id: currentVal.d_id,
                        name: currentVal.d_name,
                    },
                },
            ],
        });
        return newArray;
    }, [] as ReadMember[]);

    return response;
};

export const deleteMembership = async (
    user_id: number,
    business_id: number
): Promise<void> => {
    await getConnection()
        .transaction(async (entityManager: EntityManager) => {
            await entityManager.delete(UserRole, { user_id });
            await entityManager.delete(Membership, { user_id, business_id });
        })
        .catch((e) => {
            const { message } = e as Error;
            Logs.Error(message);
            throw new DataServiceError(
                "Unable to delete membership",
                ServiceErrorReasons.DATABASE_ERROR
            );
        });
};
