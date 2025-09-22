import { connectDB } from "@/app/lib/connectDB";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// GET - Fetch stock products with pagination, search, and current stock calculation
export const GET = async (req) => {
    try {
        const db = await connectDB();
        const stockProductsCollection = db.collection('stockProducts');
        const productsCollection = db.collection('products');

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';

        // Build query for search
        let query = {};
        if (search) {
            query.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { productId: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const total = await stockProductsCollection.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // Get stock products with pagination
        const stockProducts = await stockProductsCollection
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Calculate current stock for each product by aggregating between stockProducts and products collections
        const productsWithCurrentStock = await Promise.all(
            stockProducts.map(async (stockProduct) => {
                // Find the matching product by id and calculate total current stock from ALL variants
                const currentStockPipeline = [
                    {
                        $match: {
                            id: stockProduct.productId  // Match product by main id field
                        }
                    },
                    {
                        $unwind: "$variants"  // Unwind to process each variant separately
                    },
                    {
                        $addFields: {
                            variantStock: {
                                $switch: {
                                    branches: [
                                        {
                                            case: { $eq: ["$sizeType", "none"] },
                                            then: "$variants.noSize.availability"
                                        },
                                        {
                                            case: { $eq: ["$sizeType", "free"] },
                                            then: "$variants.freeSize.availability"
                                        },
                                        {
                                            case: { $eq: ["$sizeType", "individual"] },
                                            then: {
                                                $sum: "$variants.availableSizes.availability"
                                            }
                                        }
                                    ],
                                    default: 0
                                }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$id",  // Group by product id to sum all variants
                            totalCurrentStock: { $sum: "$variantStock" }
                        }
                    }
                ];

                const currentStockResult = await productsCollection.aggregate(currentStockPipeline).toArray();
                const currentStock = currentStockResult.length > 0 ? currentStockResult[0].totalCurrentStock : 0;

                // Calculate sold quantity and profit metrics
                const soldQuantity = Math.max(0, stockProduct.quantity - currentStock);
                const revenue = soldQuantity * stockProduct.singlePrice;
                const grossProfit = revenue; // Since we don't have cost price, using revenue as gross profit
                const profitMargin = stockProduct.singlePrice > 0 ? ((grossProfit / revenue) * 100) : 0;

                return {
                    ...stockProduct,
                    currentStock,
                    soldQuantity,
                    revenue,
                    grossProfit,
                    profitMargin: isNaN(profitMargin) ? 0 : profitMargin
                };
            })
        );

        // Calculate overall stats
        const totalInitialStock = stockProducts.reduce((sum, product) => sum + product.quantity, 0);
        const totalCurrentStock = productsWithCurrentStock.reduce((sum, product) => sum + product.currentStock, 0);
        const totalSoldQuantity = productsWithCurrentStock.reduce((sum, product) => sum + product.soldQuantity, 0);
        const totalRevenue = productsWithCurrentStock.reduce((sum, product) => sum + product.revenue, 0);
        const totalGrossProfit = productsWithCurrentStock.reduce((sum, product) => sum + product.grossProfit, 0);
        const totalInvestment = stockProducts.reduce((sum, product) => sum + product.totalPrice, 0);

        const stats = {
            totalProducts: total,
            totalInitialStock,
            totalCurrentStock,
            totalSoldQuantity,
            totalRevenue,
            totalGrossProfit,
            totalInvestment,
            averageProfitMargin: totalRevenue > 0 ? ((totalGrossProfit / totalRevenue) * 100) : 0
        };

        return NextResponse.json({
            success: true,
            products: productsWithCurrentStock,
            stats,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
        });

    } catch (error) {
        console.error("Error fetching stock products:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch stock products", details: error.message },
            { status: 500 }
        );
    }
};

// POST - Create new stock product
export const POST = async (req) => {
    try {
        const db = await connectDB();
        const stockProductsCollection = db.collection('stockProducts');

        const body = await req.json();
        const {
            productName,
            quantity,
            singlePrice,
            productId,
            category
        } = body;

        // Validation
        if (!productName || !quantity || !singlePrice || !productId) {
            return NextResponse.json(
                { success: false, error: "Product name, quantity, single price, and product ID are required" },
                { status: 400 }
            );
        }

        // Check if product with same productId already exists
        const existingProduct = await stockProductsCollection.findOne({
            productId: productId.trim()
        });
        if (existingProduct) {
            return NextResponse.json(
                { success: false, error: "Product with this product ID already exists" },
                { status: 400 }
            );
        }

        const newProduct = {
            productName: productName.trim(),
            quantity: parseInt(quantity),
            singlePrice: parseFloat(singlePrice),
            productId: productId.trim(),
            category: category?.trim() || "General",
            totalPrice: parseInt(quantity) * parseFloat(singlePrice),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await stockProductsCollection.insertOne(newProduct);

        return NextResponse.json({
            success: true,
            message: "Stock product created successfully",
            productId: result.insertedId
        });

    } catch (error) {
        console.error("Error creating stock product:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create stock product", details: error.message },
            { status: 500 }
        );
    }
};

// PUT - Update existing stock product
export const PUT = async (req) => {
    try {
        const db = await connectDB();
        const stockProductsCollection = db.collection('stockProducts');

        const body = await req.json();
        const {
            _id,
            productName,
            quantity,
            singlePrice,
            productId,
            category
        } = body;

        // Validation
        if (!_id) {
            return NextResponse.json(
                { success: false, error: "Product ID is required for update" },
                { status: 400 }
            );
        }

        if (!productName || !quantity || !singlePrice || !productId) {
            return NextResponse.json(
                { success: false, error: "Product name, quantity, single price, and product ID are required" },
                { status: 400 }
            );
        }

        // Check if another product with same productId exists (excluding current product)
        const existingProduct = await stockProductsCollection.findOne({
            productId: productId.trim(),
            _id: { $ne: new ObjectId(_id) }
        });
        if (existingProduct) {
            return NextResponse.json(
                { success: false, error: "Another product with this product ID already exists" },
                { status: 400 }
            );
        }

        const updateData = {
            productName: productName.trim(),
            quantity: parseInt(quantity),
            singlePrice: parseFloat(singlePrice),
            productId: productId.trim(),
            category: category?.trim() || "General",
            totalPrice: parseInt(quantity) * parseFloat(singlePrice),
            updatedAt: new Date()
        };

        const result = await stockProductsCollection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: "Product not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Stock product updated successfully"
        });

    } catch (error) {
        console.error("Error updating stock product:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update stock product", details: error.message },
            { status: 500 }
        );
    }
};

// DELETE - Remove stock product
export const DELETE = async (req) => {
    try {
        const db = await connectDB();
        const stockProductsCollection = db.collection('stockProducts');

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('id');

        if (!productId) {
            return NextResponse.json(
                { success: false, error: "Product ID is required" },
                { status: 400 }
            );
        }

        const result = await stockProductsCollection.deleteOne({
            _id: new ObjectId(productId)
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: "Product not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Stock product deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting stock product:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete stock product", details: error.message },
            { status: 500 }
        );
    }
};