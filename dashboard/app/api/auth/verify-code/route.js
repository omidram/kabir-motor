import { NextResponse } from "next/server";

const store = globalThis.otpStore || new Map();
globalThis.otpStore = store;

export async function POST(req) {
    try {
        const { phone, code } = await req.json();

        if (!phone || !code) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const record = store.get(phone);

        if (!record) {
            return NextResponse.json({ error: "No code" }, { status: 400 });
        }

        if (Date.now() > record.expire) {
            store.delete(phone);
            return NextResponse.json({ error: "Expired" }, { status: 400 });
        }

        if (record.code !== code) {
            return NextResponse.json({ error: "Wrong code" }, { status: 400 });
        }

        store.delete(phone);

        return NextResponse.json({ success: true });

    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}