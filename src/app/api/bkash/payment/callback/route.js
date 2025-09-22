// app/api/bkash/payment/callback/route.js
import { NextResponse } from "next/server";
import axios from "axios";
import { withBkashAuth } from "@/app/api/bkash/payment/create/route"; // 👈 reuse wrapper

// 🔹 Build headers with fresh token
export const bkashHeaders = async (bkashToken) => {
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: bkashToken,   // 👈 use passed token
        "x-app-key": process.env.bkash_api_key,
    };
};

// 🔹 Actual handler
async function handler(req, bkashToken) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "cancel" | "failure" | "success"
    const paymentID = searchParams.get("paymentID");

    console.log("bKash GET callback:", {
        status,
        paymentID,
        signature: searchParams.get("signature"),
        apiVersion: searchParams.get("apiVersion"),
    });

    if (status === "cancel" || status === "failure") {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_API_URL}/payment/error?message=${status}`
        );
    }

    if (status === "success") {
        try {
            const { data } = await axios.post(
                process.env.bkash_execute_payment_url,
                { paymentID },
                { headers: await bkashHeaders(bkashToken) } // 👈 fresh token
            );

            console.log("Execute data", data);

            if (data && data.statusCode === "0000") {
                return NextResponse.redirect(
                    `${process.env.NEXT_PUBLIC_API_URL}/payment/success`
                );
            } else {
                return NextResponse.redirect(
                    `${process.env.NEXT_PUBLIC_API_URL}/payment/error?message=${status}`
                );
            }
        } catch (error) {
            console.error("Execute failed:", error.message);
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_API_URL}/payment/error?message=${status}`
            );
        }
    }

    return NextResponse.json({ error: "Unknown payment status" }, { status: 400 });
}

// 🔹 Wrap handler with auth
export const GET = withBkashAuth(handler);
