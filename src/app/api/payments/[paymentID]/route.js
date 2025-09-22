// app/api/payments/[paymentID]/route.js - Get payment details
import { connectDB } from "@/app/lib/connectDB";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export const GET = async (req, { params }) => {
    const db = await connectDB();
    const paymentsCollection = db.collection('payments');

    try {
        const { paymentID } = params;

        const payment = await paymentsCollection.findOne({
            _id: new ObjectId(paymentID)
        });

        if (!payment) {
            return NextResponse.json(
                { error: `Payment with ID ${paymentID} not found` },
                { status: 404 }
            );
        }

        return NextResponse.json(payment, { status: 200 });

    } catch (error) {
        console.error("Error fetching payment:", error);
        return NextResponse.json(
            { error: "Failed to fetch payment", details: error.message },
            { status: 500 }
        );
    }
};
