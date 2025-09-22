import { connectDB } from "@/app/lib/connectDB";
import { NextResponse } from "next/server";

export const POST = async (req) => {
    const db = await connectDB();
    const ordersCollection = db.collection("orders");

    try {
        const billingDetails = await req.json();
        billingDetails.createdAt = new Date();
        billingDetails.status = billingDetails.status || "pending";

        // Get the highest existing orderID
        const lastOrder = await ordersCollection.find().sort({ orderID: -1 }).limit(1).toArray();
        let orderID = lastOrder.length > 0 ? lastOrder[0].orderID + 1 : 10001;

        // Ensure uniqueness by checking if the generated orderID exists
        while (await ordersCollection.findOne({ orderID })) {
            orderID += 1;
        }

        billingDetails.orderID = orderID;
        await ordersCollection.insertOne(billingDetails);

        return NextResponse.json(
            { message: "Order added successfully", orderID: orderID },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error adding Order:", error);
        return NextResponse.json(
            { error: "Failed to add Order", details: error.message },
            { status: 500 }
        );
    }
};
