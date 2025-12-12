import axios from "axios";
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/connectDB"; // Your DB connector

const TOKEN_COLLECTION = "bkash_auth"; // Dedicated collection for the token
const TOKEN_ID = "active_token_id"; // A static ID to keep only 1 document

// Helper: Manage Token Life-cycle (Step 0)
const getValidToken = async () => {
    const db = await connectDB();
    const collection = db.collection(TOKEN_COLLECTION);

    // 1. Try to fetch existing token
    const existingToken = await collection.findOne({ _id: TOKEN_ID });
    const now = Date.now();

    // 2. Check validity (Less than 58 minutes old)
    // bKash expires in 3600s (60m). We refresh at 58m (3480000ms) to be safe.
    if (existingToken && existingToken.updatedAt && (now - existingToken.updatedAt < 3480000)) {
        console.log("✅ Using cached bKash token from MongoDB");
        return existingToken.id_token;
    }

    console.log("⚠️ Token missing or expired. Fetching new one from bKash...");

    try {
        // 3. Call Grant API (Only happens if condition above fails)
        const { data } = await axios.post(
            process.env.bkash_grant_token_url,
            {
                app_key: process.env.bkash_api_key,
                app_secret: process.env.bkash_secret_key,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    username: process.env.bkash_username,
                    password: process.env.bkash_password,
                },
            }
        );

        // 4. Update/Upsert the token in MongoDB
        // We use $set to update the token and timestamp
        await collection.updateOne(
            { _id: TOKEN_ID },
            {
                $set: {
                    id_token: data.id_token,
                    updatedAt: Date.now()
                }
            },
            { upsert: true } // Create if it doesn't exist
        );

        return data.id_token;
    } catch (error) {
        throw new Error("Failed to grant token: " + error.message);
    }
};

// Middleware Wrapper
export function withBkashAuth(handler) {
    return async (req) => {
        try {
            // Get valid token (Cached or New)
            const token = await getValidToken();

            // Pass token to the actual route handler
            return handler(req, token);
        } catch (error) {
            console.error("bKash Auth Error:", error.message);
            return NextResponse.json(
                { error: "Authorization Failed", details: error.message },
                { status: 401 }
            );
        }
    };
}