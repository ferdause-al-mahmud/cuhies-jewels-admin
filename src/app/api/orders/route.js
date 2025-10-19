import { connectDB } from "@/app/lib/connectDB";
import { requireAuth } from "@/app/utils/requireAuth";
import { NextResponse } from "next/server";

export const GET = async (req) => {
    const { error, user } = await requireAuth(req);

    if (error) {
        return NextResponse.json({ error }, { status: 401 });
    }

    if (!["admin", "moderator"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await connectDB();
    const ordersCollection = db.collection("orders");

    const { searchParams } = new URL(req.url);
    const page = Number.parseInt(searchParams.get("page")) || 1;
    const limit = Number.parseInt(searchParams.get("limit")) || 10;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const skip = (page - 1) * limit;

    try {
        let query = {};

        if (status && status !== "all") {
            query.status = status;
        }

        // 🔍 Unified search by phone, name, or orderID
        if (search) {
            const regex = { $regex: search, $options: "i" }; // case-insensitive
            const isNumeric = !isNaN(search); // true if search value is a number

            query.$or = [
                { "formData.phone": regex },
                { "formData.name": regex },
            ];

            // If numeric, add an exact match on orderID (stored as Number)
            if (isNumeric) {
                query.$or.push({ orderID: Number(search) });
            }
        }


        if (type === "manual") {
            query.type = type;
        } else if (type === "web") {
            query.type = { $exists: false };
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                const startDateTime = new Date(startDate);
                startDateTime.setHours(0, 0, 0, 0);
                query.createdAt.$gte = startDateTime;
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endDateTime;
            }
        }

        const orders = await ordersCollection
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const totalFilteredOrders = await ordersCollection.countDocuments(query);
        const totalPages = Math.ceil(totalFilteredOrders / limit);
        const totalOrders = await ordersCollection.countDocuments({});

        return NextResponse.json({
            orders,
            totalOrders,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders", details: error.message },
            { status: 500 }
        );
    }
};
