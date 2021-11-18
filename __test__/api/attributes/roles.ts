import { deepClone } from "@util/obj";
import RoleKeys from "../keys/roles";

export interface CreateRoleProps {
    name: string;
    department: number[];
    global_crud_users: boolean;
    global_crud_department: boolean;
    global_crud_role: boolean;
    global_crud_resources: boolean;
    global_assign_users_to_department: boolean;
    global_assign_users_to_role: boolean;
    global_assign_resources_to_department: boolean;
    global_assign_resources_to_role: boolean;
    global_view_reports: boolean;
    dept_crud_role: boolean;
    dept_crud_resources: boolean;
    dept_assign_users_to_role: boolean;
    dept_assign_resources_to_role: boolean;
    dept_view_reports: boolean;
}
export type EditRoleProps = CreateRoleProps;
export type DeleteRoleProps = undefined;
export type ReadOneRoleProps = undefined;
export type ReadManyRoleProps = undefined;
export type RoleTypes = Record<RoleKeys, () => CreateRoleProps | undefined>;

const createRole = (): CreateRoleProps =>
    deepClone({
        name: "TEST",
        department: [-1],
        dept_assign_resources_to_role: false,
        dept_assign_users_to_role: false,
        dept_crud_resources: false,
        dept_crud_role: false,
        dept_view_reports: false,
        global_assign_resources_to_department: false,
        global_assign_resources_to_role: false,
        global_assign_users_to_department: false,
        global_assign_users_to_role: false,
        global_crud_department: false,
        global_crud_resources: false,
        global_crud_role: false,
        global_crud_users: false,
        global_view_reports: false,
    });
const editRole = (): EditRoleProps => deepClone(createRole());
const deleteRole = (): DeleteRoleProps => undefined;
const readOneRole = (): ReadOneRoleProps => undefined;
const readManyRoles = (): ReadManyRoleProps => undefined;

const attributes: RoleTypes = {
    createRole,
    deleteRole,
    readManyRoles,
    readOneRole,
    editRole,
};

export default attributes;
