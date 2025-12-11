import { connectDB } from "@/app/lib/connectDB";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async (req) => {
    try {
        const db = await connectDB();
        const ordersCollection = db.collection("orders");

        // 1. Get Date Range from URL Query Params
        const { searchParams } = new URL(req.url);
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        let startDate, endDate;

        // 2. Logic: If params exist, use them. If not, calculate ALL TIME.
        if (startDateParam && endDateParam) {
            startDate = new Date(startDateParam);
            endDate = new Date(endDateParam);
        } else {
            // Default to a date far in the past up to now
            startDate = new Date("2020-01-01");
            endDate = new Date(); // Now
        }

        // 3. The Aggregation Pipeline
        const pipeline = [
            // Stage A: Filter by Date and Status
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                    status: "delivered",
                },
            },

            // Stage B: Unwind the Cart
            { $unwind: "$cart" },

            // Stage C: Join with Products to get Buying Price
            {
                $lookup: {
                    from: "products",
                    localField: "cart.id", // Order Product ID
                    foreignField: "id",    // Product Collection ID
                    as: "productDetails",
                },
            },

            // Stage D: Unwind productDetails
            { $unwind: "$productDetails" },

            // Stage E: Project and Convert Strings to Numbers
            {
                $project: {
                    soldQuantity: { $toDouble: "$cart.quantity" },
                    sellingPrice: { $toDouble: "$cart.price" },
                    // Handle potential string format in DB
                    buyingPrice: { $toDouble: "$productDetails.buyingPrice" },
                },
            },

            // Stage F: Calculate Profit per Item
            {
                $project: {
                    soldQuantity: 1,
                    sellingPrice: 1,
                    buyingPrice: 1,
                    itemRevenue: { $multiply: ["$sellingPrice", "$soldQuantity"] },
                    itemCost: { $multiply: ["$buyingPrice", "$soldQuantity"] },
                    itemProfit: {
                        $multiply: [
                            { $subtract: ["$sellingPrice", "$buyingPrice"] },
                            "$soldQuantity",
                        ],
                    },
                },
            },

            // Stage G: Group Totals
            {
                $group: {
                    _id: null,
                    totalProfit: { $sum: "$itemProfit" },
                    totalRevenue: { $sum: "$itemRevenue" },
                    totalCost: { $sum: "$itemCost" },
                    totalItemsSold: { $sum: "$soldQuantity" },
                },
            },
        ];

        const result = await ordersCollection.aggregate(pipeline).toArray();

        // Default object if no sales found
        const data = result.length > 0 ? result[0] : {
            totalProfit: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalItemsSold: 0
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error calculating profit:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
};