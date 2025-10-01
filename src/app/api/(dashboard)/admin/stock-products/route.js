import { connectDB } from "@/app/lib/connectDB";
import { NextResponse } from "next/server";

// Simple in-memory cache
let cache = {
    data: null,
    timestamp: null,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in ms

export const GET = async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const search = searchParams.get("search") || "";

        // ✅ Check cache (skip if search used)
        if (!search && cache.data && Date.now() - cache.timestamp < CACHE_DURATION) {
            const { productsWithStats, stats } = cache.data;

            // Apply pagination on cached data
            const totalPages = Math.ceil(productsWithStats.length / limit);
            const startIndex = (page - 1) * limit;
            const paginatedProducts = productsWithStats.slice(startIndex, startIndex + limit);

            return NextResponse.json({
                success: true,
                products: paginatedProducts,
                stats,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: productsWithStats.length,
                    itemsPerPage: limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
                cached: true, // 👀 helpful for debugging
            });
        }

        // 🔌 DB fetch if no valid cache
        const db = await connectDB();
        const productsCollection = db.collection("products");

        // 🔍 Build search query
        let query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
                { id: { $regex: search, $options: "i" } },
            ];
        }

        // Fetch all matching products
        const allProducts = await productsCollection
            .find(query)
            .sort({ createdAt: -1 }) // ✅ if you store createdAt
            // .sort({ _id: -1 })   // ✅ fallback if no createdAt, since ObjectId encodes time
            .toArray();
        // 🧮 Add stock, sold, revenue, profit calculations
        const productsWithStats = allProducts.map((product) => {
            let totalStock = 0;

            if (product.sizeType === "none") {
                product.variants.forEach((variant) => {
                    totalStock += Number(variant.noSize?.availability || 0);
                });
            } else if (product.sizeType === "free") {
                product.variants.forEach((variant) => {
                    totalStock += Number(variant.freeSize?.availability || 0);
                });
            } else if (product.sizeType === "individual") {
                product.variants.forEach((variant) => {
                    variant.availableSizes?.forEach((s) => {
                        totalStock += Number(s.availability || 0);
                    });
                });
            }

            // Calculate stats
            const productRevenue = product?.buyingPrice
                ? parseInt(product?.price) - parseInt(product?.buyingPrice)
                : product?.offerPrice ? parseInt(product?.offerPrice) : product?.price;

            const soldQuantity = Number(product.sold_quantity || 0);
            const revenue = soldQuantity * (Number(productRevenue) || 0);
            const grossProfit = revenue; // assuming no cost price yet
            const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

            return {
                ...product,
                totalStock,
                soldQuantity,
                revenue,
                grossProfit,
                profitMargin,
            };
        });

        // ✅ Global Stats BEFORE pagination
        const totalStockAll = productsWithStats.reduce((sum, p) => sum + p.totalStock, 0);
        const totalSoldQuantity = productsWithStats.reduce((sum, p) => sum + p.soldQuantity, 0);
        const totalRevenue = productsWithStats.reduce((sum, p) => sum + p.revenue, 0);
        const totalGrossProfit = productsWithStats.reduce((sum, p) => sum + p.grossProfit, 0);

        const stats = {
            totalProducts: allProducts.length,
            totalStock: totalStockAll,
            totalSoldQuantity,
            totalRevenue,
            totalGrossProfit,
            averageProfitMargin:
                totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0,
        };

        // 📄 Pagination AFTER stats
        const totalPages = Math.ceil(allProducts.length / limit);
        const startIndex = (page - 1) * limit;
        const paginatedProducts = productsWithStats.slice(startIndex, startIndex + limit);

        // ✅ Update cache only when search is not used
        if (!search) {
            cache = {
                data: { productsWithStats, stats },
                timestamp: Date.now(),
            };
        }

        return NextResponse.json({
            success: true,
            products: paginatedProducts,
            stats,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: allProducts.length,
                itemsPerPage: limit,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
            cached: false,
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch products", details: error.message },
            { status: 500 }
        );
    }
};
