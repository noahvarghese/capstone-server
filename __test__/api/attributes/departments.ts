import { deepClone } from "@util/obj";
import DepartmentKeys from "../keys/departments";

export interface CreateDepartmentProps {
    name: string;
}
export type DeleteDepartmentProps = undefined;
export type EditDepartmentProps = CreateDepartmentProps;

export type DepartmentTypes = Record<
    DepartmentKeys,
    () => CreateDepartmentProps | DeleteDepartmentProps | EditDepartmentProps
>;

const createDepartment = (): CreateDepartmentProps =>
    deepClone({ name: "TEST" });
const deleteDepartment = (): DeleteDepartmentProps => undefined;
const editDepartment = (): EditDepartmentProps => deepClone({ name: "YOLO" });

const attributes: DepartmentTypes = {
    createDepartment,
    deleteDepartment,
    editDepartment,
};

export default attributes;
