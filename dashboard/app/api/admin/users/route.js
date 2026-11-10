import db from "../../../lib/db";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

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
    if (!admin)
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const users = db
        .prepare(
            "SELECT id, username, phone, email, rule, device_id, brand FROM users ORDER BY id DESC"
        )
        .all();

    return NextResponse.json(users);
}

export async function POST(req) {
    const admin = getAdmin(req);
    if (!admin)
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { username, device, brand, action } = await req.json();

    if (action !== "remove_device")
        return NextResponse.json({ error: "bad action" }, { status: 400 });

    const user = db
        .prepare("SELECT device_id, brand FROM users WHERE username = ?")
        .get(username);

    if (!user)
        return NextResponse.json({ error: "user not found" }, { status: 404 });

    let devices = user.device_id
        ? user.device_id.split(",").map((v) => v.trim()).filter(Boolean)
        : [];

    let brands = user.brand
        ? user.brand.split(",").map((v) => v.trim()).filter(Boolean)
        : [];

    const index = devices.indexOf(device);
    if (index !== -1) {
        devices.splice(index, 1);
        brands.splice(index, 1);
    }

    db.prepare(
        "UPDATE users SET device_id = ?, brand = ? WHERE username = ?"
    ).run(
        devices.length ? devices.join(", ") : null,
        brands.length ? brands.join(", ") : null,
        username
    );

    return NextResponse.json({ success: true });
}