import Business from "@models/business";
import Membership from "@models/membership";
import MembershipRequest from "@models/membership_request";
import dependencies, { ApiRoute } from "@test/sample_data/api/dependencies";
import BaseWorld from "@test/support/base_world";
import { Connection, DeepPartial } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import actions, { apiRequest } from "./actions";
import { getKey } from "./keytags";
import Request from "./request";
import attributes, {
    businessAttributes,
    ModelKey,
} from "@test/sample_data/model/attributes";
import types from "@test/sample_data/model/types";
import apiTeardownDependencies from "@test/sample_data/api/teardown_dependencies";
import User from "@models/user/user";

export default class Api {
    public static Actions = actions;
    public static Request = Request;

    public static async setup(this: BaseWorld, setup: string): Promise<void> {
        // const tags = this.getTags();
        // set earlier
        this.setCustomProp<string[]>("businessNames", [
            businessAttributes().name,
        ]);

        const tags = [setup];
        const keys = getKey<Array<ApiRoute>, typeof dependencies>(
            tags,
            "@setup_",
            dependencies,
            false
        );

        const completedDependencies: ApiRoute[] = [];

        for (const key of keys) {
            const deps = dependencies[key];

            for (const dependency of deps) {
                // prevent setting up multiple items
                if (completedDependencies.includes(dependency)) continue;
                else completedDependencies.push(dependency);

                try {
                    await apiRequest.call(this, dependency, {
                        cookie: {
                            withCookie: true,
                            saveCookie: true,
                        },
                        errorOnFail: true,
                    });
                } catch (_e) {
                    const e = _e as Error;
                    console.error(e.message);
                    console.error(`Error setting up dependency: ${dependency}`);
                    throw e;
                }
            }
        }
    }

    private static unsetKey = async <T extends X & Record<string, unknown>, X>(
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

    public static async teardown(this: BaseWorld, key: string): Promise<void> {
        // const tags = this.getTags();
        const tags = [key];
        const topLevelModelKey = getKey<
            ModelKey,
            typeof apiTeardownDependencies
        >(tags, "@cleanup_", apiTeardownDependencies, true);

        // don't run teardown if no model key found
        // as perhaps there are tests that will not require cleanup
        // or require a different cleanup
        if ((topLevelModelKey as string) === "") {
            return;
        }

        const connection = this.getConnection();
        const businessNames = this.getCustomProp<string[]>("businessNames");

        for (const name of businessNames) {
            // get business id to delete
            const business = await connection.manager.find(Business, {
                where: { name },
            });

            if (business.length > 1)
                throw new Error(`Multiple businesses found with name: ${name}`);
            else if (business.length === 0)
                throw new Error(`No businesses found with name: ${name}`);

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
            const deps = apiTeardownDependencies[topLevelModelKey];
            deps.push(topLevelModelKey);

            // starting at the most dependent table
            for (let i = deps.length - 1; i >= 0; i--) {
                const dependency = deps[i];
                const type = types[dependency];
                const attribute =
                    attributes[dependency as keyof typeof attributes]();

                // turn off any edit or delete locks
                await Api.unsetKey(
                    { business_id, member_ids },
                    "prevent_edit",
                    connection,
                    type,
                    attribute
                );

                await Api.unsetKey(
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
                const attribute =
                    attributes[dependency as keyof typeof attributes]();

                // since user and business do not have the above keys
                // delete by their ids
                if (type === Business) {
                    await connection.manager.remove<Business>(
                        Business,
                        business[0]
                    );
                } else if (type === User) {
                    for (const id of member_ids) {
                        const user = await connection.manager.findOne(User, id);
                        if (user) {
                            await connection.manager.remove<User>(User, user);
                        }
                    }
                }
                // delete any models by business or user ids
                else {
                    if (Object.keys(attribute).includes("business_id")) {
                        await connection.manager.remove(
                            await connection
                                .getRepository(type)
                                .find({ business_id })
                        );
                    }
                    if (Object.keys(attribute).includes("updated_by_user_id")) {
                        for (const id of member_ids) {
                            await connection.manager.remove(
                                await connection
                                    .getRepository(type)
                                    .find({ updated_by_user_id: id })
                            );
                        }
                    }
                    if (Object.keys(attribute).includes("user_id")) {
                        for (const id of member_ids) {
                            await connection.manager.remove(
                                await connection
                                    .getRepository(type)
                                    .find({ user_id: id })
                            );
                        }
                    }
                }
            }
        }
    }
}
