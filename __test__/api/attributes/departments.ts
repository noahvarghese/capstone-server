import { deepClone } from "@util/obj";
import DepartmentKeys from "../keys/departments";

export interface CreateDepartmentProps {
    name: string;
}
export type DeleteDepartmentProps = undefined;
export type EditDepartmentProps = CreateDepartmentProps;
export type ReadOneDepartmentProps = undefined;
export type ReadManyDepartmentProps = undefined;

export type DepartmentTypes = Record<
    DepartmentKeys,
    () =>
        | CreateDepartmentProps
        | DeleteDepartmentProps
        | EditDepartmentProps
        | ReadOneDepartmentProps
        | ReadManyDepartmentProps
>;

const createDepartment = (): CreateDepartmentProps =>
    deepClone({ name: "TEST" });
const deleteDepartment = (): DeleteDepartmentProps => undefined;
const editDepartment = (): EditDepartmentProps => deepClone({ name: "YOLO" });
const readOneDepartment = (): ReadOneDepartmentProps => undefined;
const readManyDepartments = (): ReadManyDepartmentProps => undefined;

const attributes: DepartmentTypes = {
    createDepartment,
    deleteDepartment,
    editDepartment,
    readOneDepartment,
    readManyDepartments,
};

export default attributes;
