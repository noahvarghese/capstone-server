import businessAttributes, { BusinessTypes } from "./business";
import authAttributes, { AuthTypes } from "./auth";
import passwordAttributes, { PasswordTypes } from "./password";
import memberAttributes, { MemberTypes } from "./member";
import roleAttributes, { RoleTypes } from "./roles";
import departmentAttributes, { DepartmentTypes } from "./departments";
import settingsAttributes, { SettingsTypes } from "./settings";

export type IApiRoute = BusinessTypes &
    AuthTypes &
    PasswordTypes &
    MemberTypes &
    RoleTypes &
    DepartmentTypes &
    SettingsTypes;

const attributes: IApiRoute = {
    ...businessAttributes,
    ...authAttributes,
    ...passwordAttributes,
    ...memberAttributes,
    ...roleAttributes,
    ...departmentAttributes,
    ...settingsAttributes,
};

export default attributes;
