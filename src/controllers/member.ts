import * as userService from "@services/data/user";
import { GetMembersOptions } from "@services/data/user/members";
import {
    getMembersValidator,
    deleteMemberValidator,
    updateMemberValidator,
} from "@validators/member";
import DataServiceError, { dataServiceResponse } from "@util/errors/service";
import { Request, Response } from "express";

export const getOne = async (req: Request, res: Response): Promise<void> => {
    const {
        params: { id },
        session: { current_business_id },
    } = req;

    try {
        const options: { ids: number[]; limit: number; page: number } = {
            ids: [Number(id)],
            limit: 1,
            page: 1,
        };

        getMembersValidator(options);
        const members = await userService.member.get(
            options,
            current_business_id ?? NaN
        );

        res.status(200).json(members[0]);
    } catch (e) {
        const { message, reason, field } = e as DataServiceError;
        res.status(dataServiceResponse(reason)).json({ message, field });
    }
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
    const {
        query,
        session: { current_business_id },
    } = req;

    const options: unknown = {
        limit: query.limit ?? undefined,
        page: query.page ?? undefined,
        search: query.search ?? undefined,
        sort:
            query.sortField || query.sortOrder
                ? {
                      field: query.sortField,
                      order: query.sortOrder,
                  }
                : undefined,
        filter:
            query.filterField || query.filterIds
                ? {
                      field: query.filterField,
                      ids: JSON.parse(
                          query.filterIds ? (query.filterIds as string) : "[]"
                      ),
                  }
                : undefined,
    };

    try {
        getMembersValidator(options as GetMembersOptions);
        const members = await userService.member.get(
            options as GetMembersOptions,
            current_business_id ?? NaN
        );
        res.status(200).json(members);
    } catch (e) {
        const { message, reason, field } = e as DataServiceError;
        res.status(dataServiceResponse(reason)).json({ message, field });
    }
    return;
};

export const deleteMembership = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        params: { id },
        session: { current_business_id: business_id },
    } = req;
    const user_id = Number(id);
    try {
        deleteMemberValidator(user_id);
        await userService.member.deleteMembership(user_id, business_id ?? NaN);
        res.sendStatus(200);
    } catch (e) {
        const { message, field, reason } = e as DataServiceError;
        res.status(dataServiceResponse(reason)).json({ message, field });
    }
};

export const update = async (req: Request, res: Response): Promise<void> => {
    const {
        params: { id },
        body: { first_name, last_name, email, phone, birthday },
    } = req;

    const user_id = Number(id);

    try {
        updateMemberValidator(user_id, {
            first_name,
            last_name,
            email,
            phone,
            birthday,
        });
        await userService.update(user_id, {
            first_name,
            last_name,
            email,
            phone,
            birthday,
        });
        res.sendStatus(200);
    } catch (e) {
        const { message, field, reason } = e as DataServiceError;
        res.status(dataServiceResponse(reason)).json({ message, field });
    }
};
