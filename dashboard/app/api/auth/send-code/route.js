import { NextResponse } from "next/server";

const store = globalThis.otpStore || new Map();
globalThis.otpStore = store;

export async function POST(req) {
    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json({ error: "Phone required" }, { status: 400 });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        store.set(phone, {
            code,
            expire: Date.now() + 2 * 60 * 1000
        });

        const res = await fetch("https://s.api.ir/api/sw1/SmsOTP", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer q821IqGrSP0QAvPGlEKk+iaxmeOcUX0N9wISU/jY9idLjeWNLNbsvQqxdMlD4gVNcWyT+/tHemk1TeB4XAS29WLMmf2OKHeCcPb2oobfgpU="
            },
            body: JSON.stringify({
                code,
                mobile: phone,
                template: 1
            })
        });

        const data = await res.json();

        if (!data.data) {
            return NextResponse.json({ error: "SMS failed" }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}