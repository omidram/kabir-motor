import db from "../../../lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

export async function POST(req) {
    try {
        const { username, password } = await req.json();

        // ========================
        // اعتبارسنجی ورودی
        // ========================
        if (!username || !password) {
            return NextResponse.json(
                { error: "نام کاربری و رمز الزامی است" },
                { status: 400 }
            );
        }

        // ========================
        // پیدا کردن کاربر
        // ========================
        const user = db
            .prepare("SELECT * FROM users WHERE username = ?")
            .get(username);

        if (!user) {
            return NextResponse.json(
                { error: "کاربر یافت نشد" },
                { status: 404 }
            );
        }

        // ========================
        // بررسی پسورد
        // ========================
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return NextResponse.json(
                { error: "رمز اشتباه" },
                { status: 401 }
            );
        }

        // ========================
        // ساخت JWT جدید (24h)
        // ========================
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                device_id: user.device_id || null,
            },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        // ========================
        // پاسخ + کوکی امن
        // ========================
        const res = NextResponse.json({
            success: true,
            token, // 👈 برای localStorage
            user: {
                id: user.id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                phone: user.phone,
                device_id: user.device_id,
                brand: user.brand,
                rule: user.rule
            },
        });

        res.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24, // 24h
            path: "/",
        });

        return res;

    } catch (err) {
        console.error("LOGIN ERROR:", err);

        return NextResponse.json(
            { error: "خطا در لاگین" },
            { status: 500 }
        );
    }
}
