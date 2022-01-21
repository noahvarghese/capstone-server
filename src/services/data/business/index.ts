import { RegisterBusinessProps } from "@controllers/auth";
import Business from "@models/business";
import Department from "@models/department";
import Membership from "@models/membership";
import Permission from "@models/permission";
import Role from "@models/role";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import Logs from "@util/logs/logs";
import { EntityManager, getConnection, QueryRunner } from "typeorm";

/**
 *
 * @param props
 * @param user_id
 * @param entityManager optional - will run in a transaction by itself if not provided an entityManager
 * @returns
 */
export const create = async (
    props: Pick<
        RegisterBusinessProps,
        "name" | "address" | "city" | "postal_code" | "province"
    >,
    user_id: number,
    entityManager?: EntityManager
): Promise<number> => {
    const { name, address, city, postal_code, province } = props;

    const connection = getConnection().createQueryRunner();

    if (!entityManager) {
        await (connection as QueryRunner).connect();
        await connection.startTransaction();
    } else {
        await connection.release();
    }

    const manager = entityManager ?? connection.manager;

    try {
        const [businessResult] = await Promise.all([
            manager.insert(
                Business,
                new Business({
                    name,
                    address,
                    city,
                    postal_code,
                    province,
                })
            ),
        ]);

        const business_id = businessResult.identifiers[0].id;

        const results = await Promise.all([
            manager.insert(
                Department,
                new Department({
                    business_id,
                    updated_by_user_id: user_id,
                    prevent_delete: true,
                    prevent_edit: true,
                    name: "Admin",
                })
            ),
            manager.insert(
                Permission,
                new Permission({
                    global_crud_users: true,
                    global_crud_department: true,
                    global_crud_role: true,
                    global_crud_resources: true,
                    global_assign_users_to_department: true,
                    global_assign_users_to_role: true,
                    global_assign_resources_to_department: true,
                    global_assign_resources_to_role: true,
                    global_view_reports: true,
                    dept_crud_role: true,
                    dept_crud_resources: true,
                    dept_assign_users_to_role: true,
                    dept_assign_resources_to_role: true,
                    dept_view_reports: true,
                    updated_by_user_id: user_id,
                })
            ),
        ]);

        const department_id = results[0].identifiers[0].id,
            permission_id = results[1].identifiers[0].id;

        await manager.insert(
            Role,
            new Role({
                updated_by_user_id: user_id,
                prevent_delete: true,
                name: "General",
                department_id,
                permission_id,
                prevent_edit: true,
            })
        );

        if (!entityManager) {
            await connection.commitTransaction();
        }
        return business_id;
    } catch (e) {
        if (!entityManager) {
            await connection.rollbackTransaction();
        }
        const { message } = e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            "Unable to create business",
            ServiceErrorReasons.DATABASE_ERROR
        );
    } finally {
        if (!entityManager) {
            await connection.release();
        }
    }
};

export const hasUser = async (
    user_id: number,
    business_id: number,
    entityManager?: EntityManager
): Promise<boolean> => {
    const manager = entityManager ?? getConnection().manager;

    try {
        const count = await manager.count(Membership, {
            where: { user_id, business_id },
        });

        return count > 0;
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        return false;
    }
};

export const addUser = async (
    user_id: number,
    business_id: number,
    updated_by_user_id: number,
    setDefault?: boolean,
    entityManager?: EntityManager
): Promise<void> => {
    const manager = entityManager ?? getConnection().manager;

    try {
        await manager.insert(
            Membership,
            new Membership({
                business_id,
                updated_by_user_id,
                user_id,
                default: setDefault,
            })
        );
    } catch (e) {
        const { message } = e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            "Unable to create membership",
            ServiceErrorReasons.DATABASE_ERROR
        );
    }
};
