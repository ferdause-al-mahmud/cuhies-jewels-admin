import axios from "axios";
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/connectDB";
import { withBkashAuth } from "../../middleware";

async function handler(req, bkashToken) {
    const body = await req.json();
    const { paymentID, trxID, amount, sku, reason } = body;

    // 1. Force Amount to 2 Decimal Places (String)
    // "1070" -> "1070.00"
    const formattedAmount = Number(amount).toFixed(2);

    console.log("🔹 Refund V1.2 Debug:", {
        url: process.env.bkash_refund_transaction_url,
        payload: { paymentID, trxID, amount: formattedAmount }
    });

    if (!paymentID || !trxID || !amount) {
        return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    try {
        const { data } = await axios.post(
            process.env.bkash_refund_transaction_url,
            {
                paymentID: paymentID,
                trxID: trxID,
                amount: String(formattedAmount), // ✅ Updated here
                sku: String(sku),
                reason: reason || "Customer request",
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    authorization: bkashToken,
                    "x-app-key": process.env.bkash_api_key,
                },
            }
        );

        console.log("🔹 bKash Response:", data);

        // 2. Handle Success
        // bKash V1.2 usually returns 'refundTransactionStatus' as 'Completed'
        if (data && data.transactionStatus === "Completed") {
            const db = await connectDB();
            const ordersCollection = db.collection('orders');
            const paymentsCollection = db.collection('bkash_payments');

            // A. Update Order
            await ordersCollection.updateOne(
                { trxID: trxID },
                {
                    $set: {
                        paymentStatus: "Refunded",
                        status: "refund",
                        refundTrxID: data.refundTrxID,
                        refundTime: data.completedTime
                    }
                }
            );

            // B. Log Refund
            await paymentsCollection.insertOne({
                type: "REFUND",
                originalTrxID: data.originalTrxID || trxID,
                refundTrxID: data.refundTrxID,
                amount: data.amount,
                date: data.completedTime,
                reason: reason,
                orderID: sku,
                createdAt: new Date()
            });

            return NextResponse.json(data, { status: 200 });
        }

        // 3. Handle Explicit API Errors (Like 2006 Invalid Amount)
        else if (data && data.statusCode && data.statusCode !== "0000") {
            return NextResponse.json(
                { error: data.statusMessage || "Refund Failed", code: data.statusCode },
                { status: 400 }
            );
        }

        // 4. Handle Generic Errors
        else if (data && data.errorMessage) {
            return NextResponse.json(
                { error: data.errorMessage, code: data.errorCode },
                { status: 400 }
            );
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("❌ Refund API Error:", error.response?.data || error.message);
        return NextResponse.json(
            { error: error.response?.data?.errorMessage || "Refund failed" },
            { status: 500 }
        );
    }
}

export const POST = withBkashAuth(handler);