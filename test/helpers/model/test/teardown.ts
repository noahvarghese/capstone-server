import JestBaseWorld from "../../../jest/support/base_world";
import CucumberBaseWorld from "../../../cucumber/support/base_world";
import ModelActions from "../actions";
import types from "../../../sample_data/types";
import dependencies from "../../../sample_data/dependencies";
import { pascalToCamel } from "../../../../src/util/string";
import { Connection } from "typeorm";
import User from "../../../../src/models/user/user";
import Business from "../../../../src/models/business";
import attributes from "../../../sample_data/attributes";
import Membership from "../../../../src/models/membership";
import MembershipRequest from "../../../../src/models/membership_request";

/**
 * Assumes that the model passed is cleaned up prior to this
 * @returns model
 * @param {BaseWorld} baseWorld
 * @param {new () => T} type
 */
export const teardown = async <T>(
    baseWorld: JestBaseWorld | CucumberBaseWorld,
    type: new () => T
): Promise<void> => {
    const modelName = pascalToCamel(type.name);
    const deps = dependencies[modelName as keyof typeof dependencies];

    for (let i = deps.length - 1; i > -1; i--) {
        const dependency = deps[i];

        const depType = types[dependency];

        await ModelActions.delete<typeof type>(
            baseWorld,
            depType as new () => typeof type
        );
    }
};

// export const unsetPreventDelete = () => {};
// export const unsetPreventEdit = () => {};

export const cleanupByUserAndBusiness = async <T>(
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

    const businessId = business[0].id;

    // get user ids to delete
    let memberIds = (
        await connection.manager.find<Membership>(Membership, {
            where: { business_id: businessId },
        })
    ).map((member) => member.user_id);

    memberIds = memberIds.concat(
        (
            await connection.manager.find<MembershipRequest>(
                MembershipRequest,
                {
                    where: { business_id: businessId },
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
        if (Object.keys(attribute).includes("prevent_edit")) {
            let models: unknown[] = [];

            if (Object.keys(attribute).includes("business_id")) {
                models = await connection
                    .getRepository(type)
                    .find({ business_id: businessId, prevent_edit: true });

                for (const model of models) {
                    await connection.manager.update(
                        type,
                        { business_id: businessId, prevent_edit: true },
                        { prevent_edit: false }
                    );
                }
            } else if (Object.keys(attribute).includes("updated_by_user_id")) {
                for (const id of memberIds) {
                    models = models.concat(
                        await connection.getRepository(type).find({
                            updated_by_user_id: id,
                            prevent_edit: true,
                        })
                    );
                }
            } else if (Object.keys(attribute).includes("user_id")) {
                for (const id of memberIds) {
                    models = models.concat(
                        await connection.getRepository(type).find({
                            updated_by_user_id: id,
                            prevent_edit: true,
                        })
                    );
                }
            }
        }

        // delete any models by business or user ids
        if (Object.keys(attribute).includes("business_id")) {
            await connection.manager.remove(
                await connection
                    .getRepository(type)
                    .find({ business_id: businessId })
            );
        } else if (Object.keys(attribute).includes("updated_by_user_id")) {
            for (const id of memberIds) {
                await connection.manager.remove(
                    await connection
                        .getRepository(type)
                        .find({ updated_by_user_id: id })
                );
            }
        } else if (Object.keys(attribute).includes("user_id")) {
            for (const id of memberIds) {
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
            for (const id of memberIds) {
                await connection.manager.remove<User>(
                    User,
                    await connection.manager.findOneOrFail(User, id)
                );
            }
        }
    }
};
