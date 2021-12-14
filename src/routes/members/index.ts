import * as userMembershipService from "@services/data/user/members";
import { GetMembersOptions } from "@services/data/user/members";
import {
    deleteMemberValidator,
    getMembersValidator,
    updateMemberValidator,
} from "@services/data/user/validators";
import DataServiceError, { dataServiceResponse } from "@util/errors/service";
import { Router, Request, Response } from "express";
import inviteRoute from "./invite";
import roleAssignmentRouter from "./role_assignment";

const router = Router();

router.use("/invite", inviteRoute);
router.use("/role_assignment", roleAssignmentRouter);

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
        const members = await userMembershipService.get(
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
        const members = await userMembershipService.get(
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
        await userMembershipService.deleteMembership(
            user_id,
            business_id ?? NaN
        );
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
        await userMembershipService.update(user_id, {
            first_name,
            last_name,
            email,
            phone,
            birthday,
        });
        res.sendStatus(200);
        return;
    } catch (e) {
        const { message, field, reason } = e as DataServiceError;
        res.status(dataServiceResponse(reason)).json({ message, field });
    }
};

router.get("/:id", getOne);
router.get("/", getAll);
router.delete("/:id", deleteMembership);
router.put("/:id", update);

export default router;
