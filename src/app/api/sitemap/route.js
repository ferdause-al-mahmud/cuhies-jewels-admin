import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Ensure fresh data on each request

export async function GET() {
    const siteUrl = "http://cuhiesjewels.com.bd";

    // Static links
    const links = [
        { title: "Home", path: "/", priority: 1.0 },
        // { title: "Clothing", path: "/clothing", priority: 0.8 },
        // { title: "Accessories", path: "/accessories", priority: 0.8 },
        // { title: "Winter", path: "/Winter", priority: 0.8 },
        { title: "Bags & Shoes", path: "/collections/bags-and-shoes", priority: 0.7 },
        { title: "Perfumes", path: "/perfumes", priority: 0.7 },
        { title: "Flash Sale", path: "/flashsale", priority: 0.7 },
        { title: "What's New", path: "/whatsnew", priority: 0.7 },
    ];

    const clothingCategories = [
        { title: "Saree", path: "/collections/saree", priority: 0.7 },
        { title: "Kurti", path: "/collections/kurti", priority: 0.7 },
        { title: "Gown", path: "/collections/gown", priority: 0.7 },
        { title: "Cordset", path: "/collections/cordset", priority: 0.7 },
        { title: "Kaftan", path: "/collections/kaftan", priority: 0.7 },
        { title: "One Piece", path: "/collections/one-piece", priority: 0.7 },
        { title: "Two Piece", path: "/collections/two-piece", priority: 0.7 },
        { title: "Three Piece", path: "/collections/three-piece", priority: 0.7 },
        { title: "Shirts", path: "/collections/shirts", priority: 0.7 },
        { title: "Payjamas", path: "/collections/payjamas", priority: 0.7 },
    ];

    const accessoriesCategories = [
        { title: "Hijab", path: "/accessories/hijab", priority: 0.7 },
        { title: "Rings", path: "/accessories/rings", priority: 0.7 },
        { title: "Watch", path: "/accessories/watch", priority: 0.7 },
        { title: "Bracelete", path: "/accessories/bracelete", priority: 0.7 },
        { title: "Mask and Cap", path: "/accessories/mask-and-cap", priority: 0.7 },
    ];

    const winterCategories = [
        { title: "Long Coat", path: "/winter-collections/long-coat", priority: 0.7 },
        { title: "Jacket", path: "/winter-collections/jacket", priority: 0.7 },
    ];

    try {
        const response = await fetch(`${siteUrl}/api/products`, {
            cache: "no-store",
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

        // Dynamic product URLs with lastmod
        const productsXml = data.orders
            .map((product) => {
                const lastmod = product.updatedAt ? new Date(product.updatedAt).toISOString() : new Date().toISOString();
                return `
        <url>
          <loc>${siteUrl}/product/${product.id}</loc>
          <lastmod>${lastmod}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>`;
            })
            .join("");

        // Combine all static pages & categories
        const allStaticPages = [
            ...links,
            ...clothingCategories,
            ...accessoriesCategories,
            ...winterCategories,
        ];

        const today = new Date().toISOString();

        const staticPagesXml = allStaticPages
            .map(
                (page) => `
        <url>
          <loc>${siteUrl}${page.path}</loc>
          <lastmod>${today}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>${page.priority}</priority>
        </url>`
            )
            .join("");

        // Build sitemap XML
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticPagesXml}
      ${productsXml}
    </urlset>`.trim();

        return new NextResponse(xml, {
            headers: {
                "Content-Type": "application/xml",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        });
    } catch (error) {
        console.error("Failed to generate sitemap:", error);
        return new NextResponse("Error generating sitemap", { status: 500 });
    }
}
