import Department from "@models/department";
import Membership from "@models/membership";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";
import isNumber from "@noahvarghese/get_j_opts/build/lib/isNumber";
import { Member } from "../get";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
        dbConnection,
        params: { id },
    } = req;

    if (!isNumber(id)) {
        res.sendStatus(400);
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

    const result = await dbConnection
        .createQueryBuilder()
        .select("u")
        .addSelect("r")
        .addSelect("d")
        .from(Membership, "m")
        .leftJoin(User, "u", "m.user_id = u.id")
        .leftJoin(UserRole, "ur", "ur.user_id = u.id")
        .leftJoin(Role, "r", "ur.role_id = r.id")
        .leftJoin(Department, "d", "d.id = r.department_id")
        .where("m.business_id = :business_id", {
            business_id: current_business_id,
        })
        .andWhere("u.id = :id", { id })
        .getRawMany();

    const members: Member[] = result.reduce((prev, curr) => {
        const el = (prev as Member[]).find((e) => {
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
                accepted: curr.m_accepted,
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
            } as Member[][keyof Member[]]);
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
    }, [] as Member[]);

    if (members.length !== 1) {
        res.sendStatus(500);
        return;
    }

    res.status(200).send(members[0]);
    return;
};

export default getController;