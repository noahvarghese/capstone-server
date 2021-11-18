import AuthKeys from "./keys/auth";
import BusinessKey from "./keys/business";
import DepartmentKeys from "./keys/departments";
import MemberKeys from "./keys/member";
import PasswordKeys from "./keys/password";
import RoleKeys from "./keys/roles";
import SettingsKeys from "./keys/settings";

type ApiTest =
    | BusinessKey
    | AuthKeys
    | MemberKeys
    | PasswordKeys
    | RoleKeys
    | DepartmentKeys
    | SettingsKeys;

export default ApiTest;
