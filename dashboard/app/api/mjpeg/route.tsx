import { NextRequest } from "next/server";
export const runtime = "nodejs"; // مهم برای stream

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get("url");

    if (!target) {
        return new Response("No url", { status: 400 });
    }

    try {
        const res = await fetch(target, {
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
        });

        if (!res.ok) {
            return new Response("Camera fetch failed", { status: 500 });
        }

        return new Response(res.body, {
            headers: {
                "Content-Type": res.headers.get("content-type") || "multipart/x-mixed-replace",
                "Cache-Control": "no-cache",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (e) {
        return new Response("Stream error", { status: 500 });
    }
}
