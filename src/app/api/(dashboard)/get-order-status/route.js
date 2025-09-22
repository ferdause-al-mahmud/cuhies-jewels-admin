const CACHE = new Map(); // id -> {value, expiresAt}
const TTL_MS = 60 * 1000; // 60s
const wait = (ms) => new Promise(r => setTimeout(r, ms));

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) {
            return new Response(JSON.stringify({ error: "Missing order ID" }), {
                status: 400, headers: { "Content-Type": "application/json" },
            });
        }

        // serve from a short cache to avoid repeat hits
        const now = Date.now();
        const hit = CACHE.get(id);
        if (hit && hit.expiresAt > now) {
            return new Response(JSON.stringify(hit.value), {
                status: 200,
                headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
            });
        }

        const url = `https://api-hermes.pathao.com/aladdin/api/v1/orders/${id}`;

        // super-simple: try once; if 429 or 5xx, wait and retry once
        let resp = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.PATHAO_TOKEN}`,
            },
        });

        if (resp.status === 429 || (resp.status >= 500 && resp.status < 600)) {
            // respect Retry-After if present, else 800ms
            const ra = resp.headers.get("Retry-After");
            const ms = ra ? (isFinite(+ra) ? (+ra * 1000) : Math.max(0, new Date(ra).getTime() - Date.now())) : 800;
            await wait(ms);
            resp = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.PATHAO_TOKEN}`,
                },
            });
        }

        if (!resp.ok) {
            const err = await safeJson(resp);
            return new Response(JSON.stringify({ error: "Failed to fetch order info", detail: err }), {
                status: resp.status, headers: { "Content-Type": "application/json" },
            });
        }

        const data = await resp.json();
        const payload = {
            consignment_id: data?.data?.consignment_id,
            order_status: data?.data?.order_status,
            updated_at: data?.data?.updated_at,
        };

        CACHE.set(id, { value: payload, expiresAt: now + TTL_MS });

        return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server error", detail: String(e?.message || e) }), {
            status: 500, headers: { "Content-Type": "application/json" },
        });
    }
}

async function safeJson(res) {
    try { return await res.json(); }
    catch { try { return { message: await res.text() }; } catch { return { message: "unknown" }; } }
}
