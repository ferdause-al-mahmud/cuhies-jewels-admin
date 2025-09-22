import { connectDB } from "@/app/lib/connectDB";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // This prevents static rendering issues

export const GET = async (req) => {
    try {
        // Connect to the database
        const db = await connectDB();
        const productsCollection = db.collection("products");

        // Extract query parameters from the URL
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const sortBy = searchParams.get("sortBy") || "";
        const category = searchParams.get("category") || "";

        // Build query
        const query = {};
        if (category) {
            query.$or = [
                { category: { $regex: `^${category}$`, $options: "i" } },
                { subcategory: { $regex: `^${category}$`, $options: "i" } }
            ];
        }


        // Determine sort option
        let sortOption = { createdAt: -1 };
        if (sortBy === "oldest") {
            sortOption = { createdAt: 1 };
        }

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
