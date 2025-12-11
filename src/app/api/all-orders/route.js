import { connectDB } from "@/app/lib/connectDB";
import { NextResponse } from "next/server";

export const GET = async (req) => {
    const db = await connectDB();
    const ordersCollection = db.collection("orders");

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    try {
        // Build date range query
        let dateQuery = {};
        if (startDate || endDate) {
            dateQuery.createdAt = {};
            if (startDate) {
                const startDateTime = new Date(startDate);
                startDateTime.setHours(0, 0, 0, 0);
                dateQuery.createdAt.$gte = startDateTime;
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                dateQuery.createdAt.$lte = endDateTime;
            }
        }

        // Build pagination query
        let paginationQuery = { ...dateQuery };
        if (type === "manual") {
            paginationQuery.type = type;
        } else if (type === "web") {
            paginationQuery.type = { $exists: false };
        }

        // Aggregate all statistics in parallel
        const [
            allOrdersCount,
            manualOrdersCount,
            webOrdersCount,

            deliveredOrdersCount,
            pendingOrdersCount,
            shippedOrdersCount,
            returnedOrdersCount,
            exchangeOrdersCount,
            confirmedOrdersCount,
            refundOrdersCount,
            failedOrdersCount,

            manualDeliveredCount,
            manualPendingCount,
            manualShippedCount,
            manualReturnedCount,
            manualExchangeCount,
            manualConfirmedCount,
            manualRefundCount,
            manualFailedCount,

            webDeliveredCount,
            webPendingCount,
            webShippedCount,
            webReturnedCount,
            webExchangeCount,
            webConfirmedCount,
            webRefundCount,
            webFailedCount,

            deliveredSalesAgg,
            monthlyRevenueAgg,

            paginatedOrders,
            totalPaginatedCount,
        ] = await Promise.all([
            // Total counts (no date filter)
            ordersCollection.countDocuments({}),
            ordersCollection.countDocuments({ type: "manual" }),
            ordersCollection.countDocuments({ type: { $exists: false } }),

            // Status counts in date range
            ordersCollection.countDocuments({ ...dateQuery, status: "delivered" }),
            ordersCollection.countDocuments({ ...dateQuery, status: "pending" }),
            ordersCollection.countDocuments({ ...dateQuery, status: "shipped" }),
            ordersCollection.countDocuments({ ...dateQuery, status: "returned" }),
            ordersCollection.countDocuments({ ...dateQuery, status: "exchange" }),
            ordersCollection.countDocuments({ ...dateQuery, status: "confirmed" }),
            ordersCollection.countDocuments({ ...dateQuery, status: "refund" }),
            ordersCollection.countDocuments({ ...dateQuery, status: "payment_failed" }),

            // Manual orders by status in date range
            ordersCollection.countDocuments({ ...dateQuery, type: "manual", status: "delivered" }),
            ordersCollection.countDocuments({ ...dateQuery, type: "manual", status: "pending" }),
            ordersCollection.countDocuments({ ...dateQuery, type: "manual", status: "shipped" }),
            ordersCollection.countDocuments({ ...dateQuery, type: "manual", status: "returned" }),
            ordersCollection.countDocuments({ ...dateQuery, type: "manual", status: "exchange" }),
            ordersCollection.countDocuments({ ...dateQuery, type: "manual", status: "confirmed" }),
            ordersCollection.countDocuments({ ...dateQuery, type: "manual", status: "refund" }),
            ordersCollection.countDocuments({ ...dateQuery, type: "manual", status: "payment_failed" }),

            // Web orders by status in date range
            ordersCollection.countDocuments({ ...dateQuery, type: { $exists: false }, status: "delivered" }),
            ordersCollection.countDocuments({ ...dateQuery, type: { $exists: false }, status: "pending" }),
            ordersCollection.countDocuments({ ...dateQuery, type: { $exists: false }, status: "shipped" }),
            ordersCollection.countDocuments({ ...dateQuery, type: { $exists: false }, status: "returned" }),
            ordersCollection.countDocuments({ ...dateQuery, type: { $exists: false }, status: "exchange" }),
            ordersCollection.countDocuments({ ...dateQuery, type: { $exists: false }, status: "confirmed" }),
            ordersCollection.countDocuments({ ...dateQuery, type: { $exists: false }, status: "refund" }),
            ordersCollection.countDocuments({ ...dateQuery, type: { $exists: false }, status: "payment_failed" }),

            // Sales aggregation (total, manual, web)
            ordersCollection.aggregate([
                { $match: { status: "delivered" } },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: { $ifNull: ["$total", "$total"] } },
                        manualSales: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$type", "manual"] },
                                    { $ifNull: ["$total", "$total"] },
                                    0,
                                ],
                            },
                        },
                        webSales: {
                            $sum: {
                                $cond: [
                                    { $eq: [{ $type: "$type" }, "missing"] },
                                    { $ifNull: ["$total", "$total"] },
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]).toArray(),

            // Monthly revenue aggregation (total, manual, web)
            ordersCollection.aggregate([
                { $match: { status: "delivered" } },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                        },
                        revenue: { $sum: { $ifNull: ["$total", "$total"] } },
                        manualSales: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$type", "manual"] },
                                    { $ifNull: ["$total", "$total"] },
                                    0,
                                ],
                            },
                        },
                        webSales: {
                            $sum: {
                                $cond: [
                                    { $eq: [{ $type: "$type" }, "missing"] },
                                    { $ifNull: ["$total", "$total"] },
                                    0,
                                ],
                            },
                        },
                        month: { $first: "$createdAt" },
                    },
                },
                { $sort: { "_id.year": -1, "_id.month": -1 } },
            ]).toArray(),

            // Paginated orders
            ordersCollection.find(paginationQuery)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),

            // Total count for pagination
            ordersCollection.countDocuments(paginationQuery),
        ]);

        // Extract sales data
        const salesData = deliveredSalesAgg[0] || { totalSales: 0, manualSales: 0, webSales: 0 };

        // Format month-year labels
        const formatMonthYear = (date) => {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const d = new Date(date);
            return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        };

        // Format monthly revenue breakdown
        const revenueByMonth = monthlyRevenueAgg.reduce((acc, item) => {
            const monthYear = formatMonthYear(item.month);
            acc[monthYear] = {
                month: monthYear,
                revenue: item.revenue,
                manualSales: item.manualSales,
                webSales: item.webSales,
            };
            return acc;
        }, {});

        const totalPages = Math.ceil(totalPaginatedCount / limit);

        return NextResponse.json({
            // Paginated orders
            orders: paginatedOrders,

            // Overall counts
            totalOrders: allOrdersCount,
            manualOrdersCount,
            webOrdersCount,

            // Sales totals
            totalDeliveredSales: salesData.totalSales,
            totalWebSales: salesData.webSales,
            totalManualSales: salesData.manualSales,

            // Delivered orders counts
            deliveredOrdersCount,
            deliveredManualOrdersCount: manualDeliveredCount,
            deliveredWebOrdersCount: webDeliveredCount,

            // Status counts
            pendingOrdersCount,
            manualPendingOrdersCount: manualPendingCount,
            webPendingOrdersCount: webPendingCount,

            shippedOrdersCount,
            manualShippedOrdersCount: manualShippedCount,
            webShippedOrdersCount: webShippedCount,

            returnedOrdersCount,
            manualReturnedOrdersCount: manualReturnedCount,
            webReturnedOrdersCount: webReturnedCount,

            exchangeOrdersCount,
            manualExchangeOrdersCount: manualExchangeCount,
            webExchangeOrdersCount: webExchangeCount,

            confirmedOrdersCount,
            manualConfirmedOrdersCount: manualConfirmedCount,
            webConfirmedOrdersCount: webConfirmedCount,

            refundOrdersCount,
            manualRefundOrdersCount: manualRefundCount,
            webRefundOrdersCount: webRefundCount,

            failedOrdersCount,
            manualFailedOrdersCount: manualFailedCount,
            webFailedOrdersCount: webFailedCount,

            // Monthly revenue data (with manual + web breakdown)
            revenueByMonth,

            // Pagination
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