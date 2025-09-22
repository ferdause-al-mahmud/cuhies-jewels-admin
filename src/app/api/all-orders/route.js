import { connectDB } from "@/app/lib/connectDB";
import { NextResponse } from "next/server";

export const GET = async (req) => {
    const db = await connectDB();
    const ordersCollection = db.collection('orders');

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page'));
    const limit = parseInt(searchParams.get('limit'));
    const type = (searchParams.get('type'));
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    console.log(startDate, endDate);
    const skip = (page - 1) * limit;
    try {
        // Fetch paginated orders from the collection
        let query = {};
        const allOrdersCount = await ordersCollection.countDocuments(query);
        const manualOrdersCount = await ordersCollection.countDocuments({ type: "manual" });
        const webOrdersCount = await ordersCollection.countDocuments({ type: { $exists: false } });

        const deliveredOrders = await ordersCollection.find({ status: "delivered" }).toArray();

        const webOrder = deliveredOrders.filter((order) => !order.type);
        const deliveredWebOrdersCount = webOrder.length;
        const manualOrder = deliveredOrders.filter((order) => order.type === "manual");
        const deliveredManualOrdersCount = manualOrder.length;
        // Calculate total delivered sales for web orders
        const totalWebSales = webOrder.reduce((sum, order) => {
            return sum + (order?.total_revenue ? order.total_revenue : order?.total);
        }, 0);
        // Calculate total delivered sales for manual orders
        const totalManualSales = manualOrder.reduce((sum, order) => {
            return sum + (order?.total_revenue ? order.total_revenue : order?.total);
        }, 0);
        // Calculate total delivered sales
        const totalDeliveredSales = deliveredOrders.reduce((sum, order) => {
            return sum + (order?.total_revenue ? order.total_revenue : order?.total);
        }, 0);


        if (type === "manual") {
            query.type = type;
        } else if (type === "web") {
            query.type = { $exists: false }
        }


        // Add date range filter if provided
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {

                // Set start date to beginning of day
                const startDateTime = new Date(startDate);
                startDateTime.setHours(0, 0, 0, 0);
                query.createdAt.$gte = startDateTime;

            }
            if (endDate) {
                // Set end date to end of day
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endDateTime;
            }
        }

        const orders = await ordersCollection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();

        // Get total orders count for pagination
        const totalOrders = await ordersCollection.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);

        return NextResponse.json({
            orders,
            deliveredOrders,
            totalOrders: allOrdersCount,
            manualOrdersCount,
            webOrdersCount,
            totalPages,
            currentPage: page,
            totalDeliveredSales,
            totalWebSales,
            totalManualSales,
            deliveredWebOrdersCount,
            deliveredManualOrdersCount
        });

    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders", details: error.message },
            { status: 500 }
        );
    }
};
