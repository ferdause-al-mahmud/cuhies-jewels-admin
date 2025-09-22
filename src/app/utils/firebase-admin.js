// utils/firebase-admin.js
import admin from "firebase-admin";
import { connectDB } from "../lib/connectDB";

let serviceAccount = {};

if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
        const decoded = Buffer.from(
            process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
            "base64"
        ).toString("utf8");
        serviceAccount = JSON.parse(decoded);
    } catch (err) {
        console.error("Failed to parse Firebase service account:", err);
    }
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export const verifyFirebaseToken = async (token) => {
    try {
        // Step 1: Verify the token using Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Step 2: Connect to MongoDB and find the user
        const db = await connectDB();
        const user = await db.collection("users").findOne({ email: decodedToken.email });

        if (!user) {
            throw new Error("User not found in MongoDB");
        }

        // Step 3: Return the decoded token with extra fields (role, name, _id)
        return {
            ...decodedToken,
            role: user.role || "customer",
            name: user.name,
            _id: user._id.toString(),
        };
    } catch (error) {
        console.error("Token verification or DB error:", error);
        return null;
    }
};
