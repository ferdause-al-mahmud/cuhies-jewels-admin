// utils/requireAuth.js
import { verifyFirebaseToken } from "./firebase-admin";

export const requireAuth = async (req) => {
    try {
        const token = req.headers.get("authorization")?.split("Bearer ")[1];

        if (!token) {
            return { error: "Unauthorized: No token provided" };
        }

        const user = await verifyFirebaseToken(token);

        if (!user) {
            return { error: "Unauthorized: Invalid token" };
        }

        return { user };
    } catch (error) {
        console.error("Auth error:", error);
        return { error: "Unauthorized" };
    }
};
