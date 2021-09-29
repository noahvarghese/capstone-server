import CucumberBaseWorld from "../support/base_world";
import { Connection, DeepPartial } from "typeorm";
import User from "../../../src/models/user/user";
import Business from "../../../src/models/business";
import attributes from "../../sample_data/model_attributes";
import types from "../../sample_data/types";
import dependencies from "../../sample_data/dependencies";
import Membership from "../../../src/models/membership";
import MembershipRequest from "../../../src/models/membership_request";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

const unsetKey = async <T extends X & Record<string, unknown>, X>(
    ids: {
        business_id: number;
        member_ids: number[];
    },
    key: "prevent_edit" | "prevent_delete",
    connection: Connection,
    type: new () => unknown,
    attribute: X
): Promise<void> => {
    const additionalWhere: { prevent_edit?: boolean } = {};

    if (
        key !== "prevent_edit" &&
        Object.keys(attribute).includes("prevent_edit")
    ) {
        additionalWhere["prevent_edit"] = false;
    }

    if (Object.keys(attribute).includes(key)) {
        const { business_id, member_ids } = ids;

        if (Object.keys(attribute).includes("business_id")) {
            await connection.manager.update(
                type,
                { business_id, [key]: true, ...additionalWhere },
                {
                    [key]: false,
                } as unknown as QueryDeepPartialEntity<T>
            );
        } else if (Object.keys(attribute).includes("updated_by_user_id")) {
            for (const updated_by_user_id of member_ids) {
                await connection.manager.update(
                    type,
                    { updated_by_user_id, [key]: true, ...additionalWhere },
                    {
                        [key]: false,
                    } as unknown as DeepPartial<T>
                );
            }
        } else if (Object.keys(attribute).includes("user_id")) {
            for (const id of member_ids) {
                await connection.manager.update(
                    type,
                    {
                        user_id: id,
                        [key]: true,
                        ...additionalWhere,
                    },
                    { [key]: false } as unknown as DeepPartial<T>
                );
            }
        }
    }
};

export const teardown = async <T>(
    baseWorld: CucumberBaseWorld,
    detailsKey: string,
    topLevelModelKey: string
): Promise<void> => {
    const connection = baseWorld.getCustomProp<Connection>("connection");
    const details = baseWorld.getCustomProp<T>(detailsKey);

    // get business id to delete
    const business = await connection.manager.find(Business, {
        where: { name: details["name" as keyof T] },
    });

    if (business.length > 1)
        throw new Error(
            "Multiple businesses found with name: " + details["name" as keyof T]
        );
    else if (business.length === 0)
        throw new Error(
            "No businesses found with name: " + details["name" as keyof T]
        );

    const business_id = business[0].id;

    // get user ids to delete
    let member_ids = (
        await connection.manager.find<Membership>(Membership, {
            where: { business_id },
        })
    ).map((member) => member.user_id);

    member_ids = member_ids.concat(
        (
            await connection.manager.find<MembershipRequest>(
                MembershipRequest,
                {
                    where: { business_id },
                }
            )
        ).map((member) => member.user_id)
    );

    // add top level dependency to delete
    const deps = dependencies[topLevelModelKey];
    deps.push(topLevelModelKey);

    // starting at the most dependent table
    for (let i = deps.length - 1; i >= 0; i--) {
        const dependency = deps[i];
        const type = types[dependency];
        const attribute = attributes[dependency as keyof typeof attributes]();

        // turn off any edit or delete locks
        await unsetKey(
            { business_id, member_ids },
            "prevent_edit",
            connection,
            type,
            attribute
        );

        await unsetKey(
            { business_id, member_ids },
            "prevent_delete",
            connection,
            type,
            attribute
        );
    }

    // starting at the most dependent table
    for (let i = deps.length - 1; i >= 0; i--) {
        const dependency = deps[i];
        const type = types[dependency];
        const attribute = attributes[dependency as keyof typeof attributes]();

        // delete any models by business or user ids
        if (Object.keys(attribute).includes("business_id")) {
            await connection.manager.remove(
                await connection.getRepository(type).find({ business_id })
            );
        } else if (Object.keys(attribute).includes("updated_by_user_id")) {
            for (const id of member_ids) {
                await connection.manager.remove(
                    await connection
                        .getRepository(type)
                        .find({ updated_by_user_id: id })
                );
            }
        } else if (Object.keys(attribute).includes("user_id")) {
            for (const id of member_ids) {
                await connection.manager.remove(
                    await connection.getRepository(type).find({ user_id: id })
                );
            }
        }
        // since user and business do not have the above keys
        // delete by their ids
        if (type === Business) {
            await connection.manager.remove<Business>(Business, business[0]);
        } else if (type === User) {
            for (const id of member_ids) {
                await connection.manager.remove<User>(
                    User,
                    await connection.manager.findOneOrFail(User, id)
                );
            }
        }
    }
};
