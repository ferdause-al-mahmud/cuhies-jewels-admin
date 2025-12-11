import { connectDB } from "@/app/lib/connectDB";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async (req) => {
    try {
        const db = await connectDB();
        const productsCollection = db.collection("products");

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const sortBy = searchParams.get("sortBy") || "";
        const category = searchParams.get("category") || "";
        const search = searchParams.get("search") || "";
        const type = searchParams.get("type") || "";

        // Build the MongoDB Query
        const query = {};
        const andConditions = [];

        // 1. Search Logic (Name or ID)
        if (search) {
            const searchRegex = { $regex: search, $options: "i" };
            andConditions.push({
                $or: [
                    { name: searchRegex },
                    { id: searchRegex } // Searches your custom ID (e.g., "co-26")
                ]
            });
        }

        // 2. Category Filter (Category or Subcategory)
        if (category) {
            andConditions.push({
                $or: [
                    { category: { $regex: `^${category}$`, $options: "i" } },
                    { subcategory: { $regex: `^${category}$`, $options: "i" } }
                ]
            });
        }

        // 3. Type Filter
        if (type) {
            // 'type' is an array in DB. Finds docs where array contains this string.
            andConditions.push({ type: type });
        }

        // Combine all conditions
        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        // Sort Logic
        let sortOption = { createdAt: -1 }; // Default: Newest first
        if (sortBy === "oldest") sortOption = { createdAt: 1 };
        if (sortBy === "price_low") sortOption = { price: 1 };
        if (sortBy === "price_high") sortOption = { price: -1 };

        // Pagination
        const totalProducts = await productsCollection.countDocuments(query);
        const skip = (page - 1) * limit;

        const allProducts = await productsCollection
            .find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .toArray();

        return NextResponse.json({
            products: allProducts,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error("Error fetching all products:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
};