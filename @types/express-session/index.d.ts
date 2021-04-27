export interface SessionData {
    // TODO Replacewith user model
    user: User;
}

declare module "express-session" {
    export interface SessionData {
        user_id: number;
        long_term_care_home_id: number;
    }
}
