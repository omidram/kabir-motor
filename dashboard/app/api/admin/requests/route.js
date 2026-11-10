import db from "../../../lib/db";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";
export const runtime = "nodejs";

function getAdmin(req) {
    try {
        const auth = req.headers.get("authorization");
        if (!auth) return null;
        const token = auth.replace("Bearer ", "");
        const decoded = jwt.verify(token, JWT_SECRET);
        const admin = db
            .prepare("SELECT id, rule FROM users WHERE id = ?")
            .get(decoded.id);
        if (!admin || admin.rule !== "admin") return null;
        return admin;
    } catch {
        return null;
    }
}

export async function GET(req) {
    const admin = getAdmin(req);
    if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const rows = db.prepare("SELECT * FROM request ORDER BY id DESC").all();
    return NextResponse.json(rows);
}

export async function POST(req) {
    const admin = getAdmin(req);
    if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id, action } = await req.json();

    const row = db.prepare("SELECT * FROM request WHERE id = ?").get(id);
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

    if (action === "accept") {
        const user = db
            .prepare("SELECT device_id, brand FROM users WHERE username = ?")
            .get(row.username);

        let devices = user?.device_id
            ? user.device_id.split(",").map(v => v.trim()).filter(Boolean)
            : [];

        let brands = user?.brand
            ? user.brand.split(",").map(v => v.trim()).filter(Boolean)
            : [];

        if (!devices.includes(row.device_id)) devices.push(row.device_id);
        if (!brands.includes(row.brand)) brands.push(row.brand);

        db.prepare(`
            UPDATE users
            SET device_id = ?, brand = ?
            WHERE username = ?
        `).run(devices.join(", "), brands.join(", "), row.username);

        db.prepare("DELETE FROM request WHERE id = ?").run(id);
        return NextResponse.json({ success: true });
    }

    if (action === "delete") {
        db.prepare("DELETE FROM request WHERE id = ?").run(id);
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "bad action" }, { status: 400 });
}