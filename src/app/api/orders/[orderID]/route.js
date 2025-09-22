//api/orders/[orderID]/route.js

import { connectDB } from "@/app/lib/connectDB";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export const GET = async (req, { params }) => {
    const db = await connectDB();
    const ordersCollection = db.collection('orders');

    try {
        const { orderID } = params;

        const order = await ordersCollection.findOne({ _id: new ObjectId(orderID) });

        if (!order) {
            return NextResponse.json(
                { error: `Order with ID ${orderID} not found` },
                { status: 404 }
            );
        }

        return NextResponse.json(order, { status: 200 });

    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(
            { error: "Failed to fetch order", details: error.message },
            { status: 500 }
        );
    }
};

export const PUT = async (req, { params }) => {
    const db = await connectDB();
    const ordersCollection = db.collection('orders');
    const orderID = parseInt(params.orderID);
    const { status } = await req.json();

    try {
        // Case 1: Status is NOT 'delivered'
        if (status !== 'delivered') {
            const result = await ordersCollection.updateOne(
                { orderID },
                { $set: { status } }
            );

            if (result.modifiedCount === 0) {
                return NextResponse.json({ error: "Order not found" }, { status: 404 });
            }

            return NextResponse.json({ message: "Order updated successfully" }, { status: 200 });
        }

        // Case 2: Status is 'delivered'
        const order = await ordersCollection.findOne({ orderID });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Sub-case A: No consignment_id, just update status
        if (!order.consignment_id) {
            const result = await ordersCollection.updateOne(
                { orderID },
                { $set: { status } }
            );

            if (result.modifiedCount === 0) {
                return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
            }

            return NextResponse.json({ message: "Order status updated (no consignment ID)" }, { status: 200 });
        }

        // Sub-case B: consignment_id exists → Fetch product revenue
        const apiResponse = await fetch(`${process.env.API_URL}/api/product-revenue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cID: order.consignment_id })
        });

        if (!apiResponse.ok) {
            return NextResponse.json({ error: "Failed to fetch product revenue" }, { status: 502 });
        }

        const { data } = await apiResponse.json();

        if (!data || typeof data.order_amount !== 'number' || typeof data.total_fee !== 'number') {
            return NextResponse.json({ error: "Invalid data from product-revenue API" }, { status: 500 });
        }

        const total_revenue = data.order_amount - data.total_fee;

        const result = await ordersCollection.updateOne(
            { orderID },
            {
                $set: {
                    status,
                    total_revenue
                }
            }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json({ error: "Failed to update order with profit" }, { status: 500 });
        }

        return NextResponse.json({ message: "Order updated with profit successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json(
            { error: "Failed to update order", details: error.message },
            { status: 500 }
        );
    }
};

export async function DELETE(request, { params }) {
    const db = await connectDB();
    const ordersCollection = db.collection('orders');

    try {
        const { orderID } = params;
        // Find the order first to check if it exists and get its data
        console.log(orderID);
        const order = await ordersCollection.findOne({ orderID: parseInt(orderID) });
        if (!order) {
            return NextResponse.json(
                { message: "Order not found" },
                { status: 404 }
            );
        }

        // Delete the order
        const result = await ordersCollection.deleteOne({ orderID: parseInt(orderID) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { message: "Failed to delete order" },
                { status: 500 }
            );
        }

        // If the order was not returned, we need to update inventory
        if (order.status !== "returned") {
            const quantityUpdates = order.cart?.map((item) => ({
                productId: item.id,
                size: item.selectedSize,
                quantity: Number.parseInt(item.quantity, 10), // Positive to add back to inventory
            }));

            // Update inventory
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/update-quantity`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updates: quantityUpdates }),
            });
        }

        return NextResponse.json(
            { message: "Order deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting order:", error);
        return NextResponse.json(
            { message: "Error deleting order" },
            { status: 500 }
        );
    }
}
