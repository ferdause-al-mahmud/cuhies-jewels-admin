import axios from "axios";
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/connectDB";
import { withBkashAuth } from "../../middleware";

async function handler(req, bkashToken) {
    const body = await req.json();
    const { paymentID, trxID, amount, sku, reason } = body;
    console.log("🔹 Refund Debug:", {
        url: process.env.bkash_refund_transaction_url,
        appKeyExists: !!process.env.bkash_api_key, // Should be true
        tokenExists: !!bkashToken, // Should be true
        payload: { paymentID, trxID, amount }
    });
    // Basic Validation
    if (!paymentID || !trxID || !amount) {
        return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    try {
        // 1. Call bKash Refund API
        const { data } = await axios.post(
            process.env.bkash_refund_transaction_url,
            {
                paymentID: paymentID,
                trxID: trxID,
                refundAmount: String(amount), // Ensure it's a string
                sku: sku, // Usually your Order ID
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

        // 2. Handle Success Response
        if (data && data.refundTransactionStatus === "Completed") {
            const db = await connectDB();
            const ordersCollection = db.collection('orders');
            const paymentsCollection = db.collection('bkash_payments');

            // A. Update the Order Status
            // We search by trxID or sku (Order ID)
            await ordersCollection.updateOne(
                { trxID: trxID },
                {
                    $set: {
                        paymentStatus: "Refunded",
                        status: "refund", // Updates the badge color in your Admin Panel
                        refundTrxID: data.refundTrxId,
                        refundTime: data.completedTime
                    },
                    // Optional: If you want to deduct the revenue from total calculations
                    // $inc: { total: -Number(amount) } 
                }
            );

            // B. Log the Refund in Payments Collection
            // You can insert a new record or update the existing one. 
            // Here we insert a new "Refund" type record for history tracking.
            await paymentsCollection.insertOne({
                type: "REFUND",
                originalTrxID: data.originalTrxId,
                refundTrxID: data.refundTrxId,
                amount: data.refundAmount,
                date: data.completedTime,
                reason: data.reason,
                orderID: sku,
                createdAt: new Date()
            });

            return NextResponse.json(data, { status: 200 });
        }

        // 3. Handle bKash Logic Errors (e.g. "Already Refunded", "Insufficient Balance")
        else if (data && data.errorMessage) {
            return NextResponse.json(
                { error: data.errorMessage, code: data.errorCode },
                { status: 400 }
            );
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Refund API Error:", error.response?.data || error.message);
        return NextResponse.json(
            { error: error.response?.data?.errorMessage || "Refund failed" },
            { status: 500 }
        );
    }
}

// Wrap with your existing Auth Middleware
export const POST = withBkashAuth(handler);