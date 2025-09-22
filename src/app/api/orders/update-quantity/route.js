import { connectDB } from "@/app/lib/connectDB";
import { NextResponse } from "next/server";

export async function POST(req) {
    const db = await connectDB();
    const productsCollection = db.collection("products");

    try {
        const { updates } = await req.json();

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json(
                { success: false, error: "Invalid updates data" },
                { status: 400 }
            );
        }

        const results = [];

        for (const update of updates) {
            try {
                const { productId, variantId, size, quantity } = update;

                if (!productId || !variantId || quantity === undefined) {
                    results.push({
                        productId,
                        variantId,
                        success: false,
                        message:
                            "Missing required fields (productId, variantId, quantity)",
                    });
                    continue;
                }

                // Find parent product
                const product = await productsCollection.findOne({ id: productId });
                if (!product) {
                    results.push({
                        productId,
                        variantId,
                        success: false,
                        message: `Parent product with ID ${productId} not found`,
                    });
                    continue;
                }

                // Find variant by its productId
                const variant = product.variants?.find(
                    (v) => v.productId === variantId
                );
                if (!variant) {
                    results.push({
                        productId,
                        variantId,
                        success: false,
                        message: `Variant with productId ${variantId} not found`,
                    });
                    continue;
                }

                let updateQuery = { id: productId, "variants.productId": variantId };
                let updateField = "";
                let arrayFilters = [{ "v.productId": variantId }];
                let currentAvailability = 0;

                // Case 1: Individual sizes
                if (
                    product.sizeType === "individual" &&
                    size &&
                    variant.availableSizes &&
                    Array.isArray(variant.availableSizes)
                ) {
                    const sizeObj = variant.availableSizes.find((s) => s.size === size);
                    if (!sizeObj) {
                        results.push({
                            productId,
                            variantId,
                            success: false,
                            message: `Size ${size} not found in variant ${variantId}`,
                        });
                        continue;
                    }

                    currentAvailability = parseInt(sizeObj.availability, 10) || 0;
                    updateField = "variants.$[v].availableSizes.$[s].availability";
                    arrayFilters.push({ "s.size": size });
                }
                // Case 2: Free size
                else if (product.sizeType === "free" && variant.freeSize) {
                    currentAvailability =
                        parseInt(variant.freeSize.availability, 10) || 0;
                    updateField = "variants.$[v].freeSize.availability";
                }
                // Case 3: No size
                else if (product.sizeType === "none" && variant.noSize) {
                    currentAvailability =
                        parseInt(variant.noSize.availability, 10) || 0;
                    updateField = "variants.$[v].noSize.availability";
                } else {
                    results.push({
                        productId,
                        variantId,
                        success: false,
                        message: `Unsupported sizeType or missing fields for product ${productId}`,
                    });
                    continue;
                }

                const newAvailability =
                    currentAvailability + parseInt(quantity, 10);

                if (newAvailability < 0) {
                    results.push({
                        productId,
                        variantId,
                        size: size || "N/A",
                        success: false,
                        message: `Insufficient inventory for ${variantId} ${size || ""}`,
                    });
                    continue;
                }

                await productsCollection.updateOne(
                    updateQuery,
                    { $set: { [updateField]: newAvailability.toString() } },
                    { arrayFilters }
                );

                results.push({
                    productId,
                    variantId,
                    size: size || "N/A",
                    success: true,
                    message: `Availability updated to ${newAvailability}`,
                });
            } catch (error) {
                results.push({
                    productId: update.productId,
                    variantId: update.variantId,
                    success: false,
                    message: error.message,
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Product quantities processing complete",
            results,
        });
    } catch (error) {
        console.error("Error updating product quantities:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to update product quantities",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
