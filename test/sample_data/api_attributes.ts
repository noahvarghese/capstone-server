import attributes from "./model_attributes";

const business = attributes.business();
const user = attributes.user();

const registerBusiness = {
    name: business.name,
    address: business.address,
    city: business.city,
    postal_code: business.postal_code,
    province: business.province,
    first_name: user.first_name,
    last_name: user.last_name,
    password: user.password,
    confirm_password: user.password,
    email: user.email,
    phone: user.phone,
};

export default {
    registerBusiness,
};
