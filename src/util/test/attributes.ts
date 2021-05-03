import { BusinessAttributes } from "../../models/business";
import { DepartmentAttributes } from "../../models/department";
import { UserAttributes } from "../../models/user/user";

// Configuration
export const businessAttributes: BusinessAttributes = {
    name: "Oakville Windows and Doors",
    address: "1380 Speers Rd",
    city: "Oakville",
    province: "ON",
    country: "CA",
    postal_code: "L6H1X1",
};

export const userAttributes: UserAttributes = {
    first_name: "Noah",
    last_name: "Varghese",
    email: "varghese.noah@gmail.com",
    password: "password",
    address: "207 Elderwood Trail",
    city: "Oakville",
    postal_code: "L6H1X1",
    province: "ON",
    country: "CA",
    birthday: new Date("1996-08-07"),
    original_phone: "647 771 5777",
    phone: 6477715777,
    business_id: -1,
};

export const departmentAttributes: DepartmentAttributes = {
    name: "Management",
    business_id: 1,
    updated_by_user_id: -1,
};
