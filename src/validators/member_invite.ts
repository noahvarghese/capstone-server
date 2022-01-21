export const sendInviteValidator = (props: InviteMemberProps): void => {
    const userInfo = Object.assign(emptyInviteUser(), props);
    const result = emptyChecker<InviteMemberProps>(userInfo);

    if (result) {
        throw new ServiceError(
            result.message,
            ServiceErrorReasons.PARAMETERS_MISSING,
            result.field
        );
    }

    const { email, phone } = props;

    if (validator.isEmail(email) === false) {
        throw new ServiceError(
            "Invalid email.",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "email"
        );
    }

    if (!isPhone(phone)) {
        throw new ServiceError(
            "Invalid phone number",
            ServiceErrorReasons.PARAMETERS_MISSING,
            "phone"
        );
    }
};
