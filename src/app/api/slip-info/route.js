// api/slip-info/route.js

import { connectDB } from "@/app/lib/connectDB";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export const GET = async (req) => {
    try {
        const db = await connectDB();
        const ordersCollection = db.collection("orders");

        // Get query params from URL
        const { searchParams } = new URL(req.url);
        const orderID = searchParams.get("orderID");

        if (!orderID) {
            return NextResponse.json(
                { error: "Missing orderID in query params" },
                { status: 400 }
            );
        }

        if (!ObjectId.isValid(orderID)) {
            return NextResponse.json(
                { error: "Invalid orderID format" },
                { status: 400 }
            );
        }

        const order = await ordersCollection.findOne({
            _id: new ObjectId(orderID),
        });

        if (!order) {
            return NextResponse.json(
                { error: `Order with ID ${orderID} not found` },
                { status: 404 }
            );
        }

        // Transform response: pick only required fields
        const responseData = {
            orderID: order.orderID,
            cart: order.cart.map((item) => ({
                name: item.name,
                variantId: item.variantId,
                variant: item.variant,
                quantity: item.quantity,
                selectedSize: item.selectedSize || null,
                price: item.price,
            })),
            total: order.total,
        };

        return NextResponse.json(responseData, { status: 200 });
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(
            { error: "Failed to fetch order", details: error.message },
            { status: 500 }
        );
    }
};
