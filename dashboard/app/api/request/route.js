import db from "../../lib/db";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

export const runtime = "nodejs";

export async function POST(req) {
    try {
        const auth = req.headers.get("authorization");
        if (!auth) {
            return NextResponse.json({ error: "no token" }, { status: 401 });
        }

        const token = auth.replace("Bearer ", "");
        const decoded = jwt.verify(token, JWT_SECRET);

        const { brand, device_id } = await req.json();

        if (!brand || !device_id) {
            return NextResponse.json({ error: "missing fields" }, { status: 400 });
        }

        const user = db
            .prepare("SELECT id,username,email,phone FROM users WHERE id = ?")
            .get(decoded.id);

        if (!user) {
            return NextResponse.json({ error: "user not found" }, { status: 404 });
        }

        const exists = db
            .prepare("SELECT id FROM request WHERE username = ? LIMIT 1")
            .get(user.username);

        if (exists) {
            return NextResponse.json({ error: "already requested" }, { status: 409 });
        }

        const insert = db.prepare(`
            INSERT INTO request (username,email,phone,device_id,brand)
            VALUES (?,?,?,?,?)
        `);

        const result = insert.run(
            user.username,
            user.email,
            user.phone,
            device_id,
            brand
        );

        return NextResponse.json({
            success: true,
            id: result.lastInsertRowid,
        });
    } catch (err) {
        return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }
}