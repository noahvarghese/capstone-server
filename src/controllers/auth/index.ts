import { Request, Response } from "express";
import forgotPassword from "./forgot_password";
import login from "./login";
import logout from "./logout";
import register from "./register";
import resetPassword from "./reset_password";

const auth = (_: Request, res: Response): void => {
    res.sendStatus(200);
};

const authRoutes = {
    auth,
    login,
    forgotPassword,
    resetPassword,
    register,
    logout,
};

export default authRoutes;
