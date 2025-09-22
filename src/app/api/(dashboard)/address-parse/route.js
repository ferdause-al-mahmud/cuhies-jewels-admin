// src/app/api/address-parse/route.js

export async function POST(request) {
    try {
        const body = await request.json();
        const response = await fetch("https://merchant.pathao.com/api/v1/address-parser", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.PATHAO_TOKEN}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        console.log(response)
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: "Server error",
            detail: error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
