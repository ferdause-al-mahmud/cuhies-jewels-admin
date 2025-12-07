// pages/api/products.js
import { connectDB } from "@/app/lib/connectDB";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic"; // This prevents static rendering issues

export async function GET(req) {
    const db = await connectDB();
    const productsCollection = db.collection("products");

    const { searchParams } = new URL(req.url);
    const searchText = searchParams.get("name");

    try {
        // If a searchText is provided, search products by name and id
        let sortOption = { createdAt: -1 }
        let query = {};
        if (searchText) {
            query = {
                $or: [
                    { name: { $regex: new RegExp(searchText, "i") } },
                    { id: { $regex: new RegExp(searchText, "i") } }
                ]
            }
        }
        console.log(query)

        // Fetch matching products
        const products = await productsCollection.find(query).sort(sortOption).limit(20).toArray();

        return NextResponse.json({ orders: products });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products", details: error.message },
            { status: 500 }
        );
    }
}
