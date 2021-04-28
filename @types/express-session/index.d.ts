// Unsure of why I have to declare it twice
export interface SessionData {
    user_id: number;
    business_id: number;
}

declare module "express-session" {
    interface SessionData {
        user_id: number;
        business_id: number;
    }
}
