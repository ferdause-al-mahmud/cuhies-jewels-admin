// app/api/bkash/payment/create/route.js
import axios from "axios";
import { NextResponse } from "next/server";
import { setValue, getValue, unsetValue, flush } from "node-global-storage";
import { v4 as uuidv4 } from "uuid";

// 🔹 Middleware-like wrapper
export function withBkashAuth(handler) {
    return async (req) => {
        unsetValue("id_token"); // ✅ clear old token

        try {
            // Request bKash token
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

            const token = data.id_token;

            setValue("id_token", token, { protected: true });
            // ✅ Pass token to handler
            return handler(req, token);
        } catch (error) {
            console.error("bKash auth failed:", error.message);
            return NextResponse.json(
                { error: "Unauthorized", details: error.message },
                { status: 401 }
            );
        }
    };
}

// 🔹 Your actual route handler
async function handler(req, bkashToken) {
    const body = await req.json();
    const { amount, orderID } = body;
    const headers = await bkashHeaders();
    console.log(headers)
    try {
        const { data } = await axios.post(
            process.env.bkash_create_payment_url,
            {
                mode: "0011",
                payerReference: " ",
                callbackURL: `${process.env.API_URL}/api/bkash/payment/callback`,
                amount: amount,
                currency: "BDT",
                intent: "sale",
                merchantInvoiceNumber: "Inv" + uuidv4().substring(0, 5),
            },
            {
                headers: await bkashHeaders(), // ✅ fixed
            }
        );
        return NextResponse.json({ bkashURL: data.bkashURL }, { status: 200 }); // ✅ fixed
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 401 }); // ✅ fixed
    }
}


// 🔹 Export wrapped handler
export const POST = withBkashAuth(handler);


export const bkashHeaders = async () => {
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: getValue('id_token'),
        'x-app-key': process.env.bkash_api_key,
    }
}