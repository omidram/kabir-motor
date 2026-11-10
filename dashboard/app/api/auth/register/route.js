import db from "../../../lib/db";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

const store = globalThis.otpStore || new Map();
globalThis.otpStore = store;

export async function POST(req) {
    try {
        const { username, firstname, lastname, phone, email, password, code } = await req.json();

        if (!username || !phone || !password || !code || !firstname || !lastname) {
            return NextResponse.json({ error: "missing" }, { status: 400 });
        }

        if (!/^09\d{9}$/.test(phone)) {
            return NextResponse.json({ error: "phone invalid" }, { status: 400 });
        }

        const otp = store.get(phone);
        if (!otp || otp.code !== code || Date.now() > otp.expire) {
            return NextResponse.json({ error: "code invalid" }, { status: 400 });
        }

        const strong =
            password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[0-9]/.test(password);

        if (!strong) {
            return NextResponse.json({ error: "weak password" }, { status: 400 });
        }

        const exist = db.prepare(
            "SELECT id FROM users WHERE username = ? OR phone = ? OR (email IS NOT NULL AND email = ?)"
        ).get(username, phone, email || null);

        if (exist) {
            return NextResponse.json({ error: "exists" }, { status: 409 });
        }

        const hash = await bcrypt.hash(password, 12);

        const result = db.prepare(`
            INSERT INTO users 
            (username, firstname, lastname, phone, email, password, rule)
            VALUES (?, ?, ?, ?, ?, ?, 'user')
        `).run(
            username,
            firstname,
            lastname,
            phone,
            email || null,
            hash
        );

        store.delete(phone);

        return NextResponse.json({
            success: true,
            userId: result.lastInsertRowid
        });

    } catch (err) {
        return NextResponse.json({ error: "server" }, { status: 500 });
    }
}