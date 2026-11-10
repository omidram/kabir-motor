import db from "../../../lib/db";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

export async function GET(req) {
    try {
        const auth = req.headers.get("authorization");
        if (!auth) return NextResponse.json({ error: "no token" }, { status: 401 });

        const token = auth.replace("Bearer ", "");
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = db
            .prepare("SELECT id, username, firstname, lastname, phone, email, rule, device_id, brand FROM users WHERE id = ?")
            .get(decoded.id);

        if (!user) {
            return NextResponse.json({ error: "user not found" }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch {
        return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }
}