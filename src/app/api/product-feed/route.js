import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Ensure fresh data on each request

export async function GET() {
    const siteUrl = "https://www.http://cuhiesjewels.com.bd"; // Use your live domain

    try {
        // Fetch latest product data from API
        const response = await fetch(`${siteUrl}/api/products`, {
            cache: "no-store",  // Ensures a fresh request
            headers: {
                "Pragma": "no-cache",
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        });

        if (!response.ok) throw new Error("Failed to fetch product data");

        const data = await response.json();

        if (!data.orders || !Array.isArray(data.orders)) {
            throw new Error("Invalid API response format");
        }

        // Generate XML for products
        const productsXml = data.orders.map((product) => `
            <item>
                <g:id>${product.id}</g:id>
                <title>${product.name}</title>
                <description><![CDATA[${product.description}]]></description>
                <link>${siteUrl}/product/${product.id}</link>
                <g:image_link>${product.imageUrl[0]}</g:image_link>
                <g:additional_image_link>${product.imageUrl.slice(1).join(", ")}</g:additional_image_link>
                <g:brand>ClassyTouch</g:brand>
                <g:condition>new</g:condition>
                <g:price>${product?.offerPrice ? product?.offerPrice : product.price} BDT</g:price>
                ${product?.offerPrice &&
            ` <g:offerPrice>${product.offerPrice} BDT</g:offerPrice>`
            }
                <g:availability>${product.availableSizes.some(size => size.availability > 0) ? "in_stock" : "out_of_stock"}</g:availability>
                <g:product_type>${product.category} > ${product.subcategory}</g:product_type>
                <g:google_product_category>166</g:google_product_category> <!-- Example Category: Apparel & Accessories -->
                <g:item_group_id>${product.id}</g:item_group_id>
                ${product.availableSizes.map(size => `
                    <g:size>${size.size}</g:size>
                    <g:availability>${size.availability > 0 ? "in_stock" : "out_of_stock"}</g:availability>
                `).join("")}
            </item>
        `).join("");

        // Build the XML feed
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
            <channel>
                <title>ClassyTouch Product Feed</title>
                <link>${siteUrl}</link>
                <description>ClassyTouch product catalog for Facebook Commerce</description>
                ${productsXml}
            </channel>
        </rss>`;

        return new NextResponse(xml, {
            headers: {
                "Content-Type": "application/xml",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        });

    } catch (error) {
        console.error("Failed to generate Facebook product feed:", error);
        return new NextResponse("Error generating product feed", { status: 500 });
    }
}
