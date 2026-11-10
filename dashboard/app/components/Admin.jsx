"use client";
import { useEffect, useState } from "react";
import { Check, Trash2, Users, Smartphone, Shield, MapIcon } from "lucide-react";

export default function Admin({ setSelector }) {
    const [tab, setTab] = useState("requests");
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

    const loadRequests = async () => {
        try {
            const res = await fetch("/api/admin/requests", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json().catch(() => []);
            setRequests(Array.isArray(json) ? json : []);
        } catch {
            setRequests([]);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await fetch("/api/admin/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json().catch(() => []);
            setUsers(Array.isArray(json) ? json : []);
        } catch {
            setUsers([]);
        }
    };

    useEffect(() => {
        loadRequests();
        loadUsers();
    }, []);

    const requestAction = async (id, type) => {
        await fetch("/api/admin/requests", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id, action: type }),
        });
        loadRequests();
        loadUsers();
    };

    const removeDevice = async (username, device, brand) => {
        await fetch("/api/admin/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ username, device, brand, action: "remove_device" }),
        });
        loadUsers();
    };

    return (
        <div className="min-h-screen w-full bg-transparent p-20 text-white">
            <div className="max-w-5xl mx-auto">
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setTab("requests")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${tab === "requests"
                            ? "bg-red-600 border-red-500"
                            : "border-white/20 bg-black/40"
                            }`}
                    >
                        <Shield size={16} />
                        درخواست‌ها
                    </button>
                    <button
                        onClick={() => setTab("users")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${tab === "users"
                            ? "bg-red-600 border-red-500"
                            : "border-white/20 bg-black/40"
                            }`}
                    >
                        <Users size={16} />
                        کاربران
                    </button>
                </div>

                {tab === "requests" && (
                    <div className="grid gap-4">
                        {requests.length === 0 && (
                            <div className="text-center text-white/50">
                                درخواستی وجود ندارد
                            </div>
                        )}

                        {requests.map((r) => (
                            <div
                                key={r.id}
                                className="bg-black/60 border border-white/10 rounded-xl p-4 shadow-[0_0_25px_rgba(255,0,0,0.25)]"
                            >
                                <div className="text-sm space-y-1">
                                    <div>Username: {r.username}</div>
                                    <div>Email: {r.email}</div>
                                    <div>Phone: {r.phone}</div>
                                    <div>Brand: {r.brand}</div>
                                    <div>Device: {r.device_id}</div>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => requestAction(r.id, "accept")}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500"
                                    >
                                        <Check size={16} />
                                        Accept
                                    </button>

                                    <button
                                        onClick={() => requestAction(r.id, "delete")}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === "users" && (
                    <div className="grid gap-4">
                        {users.length === 0 && (
                            <div className="text-center text-white/50">
                                کاربری یافت نشد
                            </div>
                        )}

                        {users.map((u) => {
                            const devices = u.device_id
                                ? u.device_id.split(",").map((v) => v.trim()).filter(Boolean)
                                : [];
                            const brands = u.brand
                                ? u.brand.split(",").map((v) => v.trim()).filter(Boolean)
                                : [];

                            return (
                                <div
                                    key={u.id}
                                    className="bg-black/60 border border-white/10 rounded-xl p-4 shadow-[0_0_25px_rgba(255,0,0,0.2)]"
                                >
                                    <div className="text-sm space-y-1">
                                        <div>Username: {u.username}</div>
                                        <div>Email: {u.email}</div>
                                        <div>Phone: {u.phone}</div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {devices.length === 0 && (
                                            <div className="text-white/40 text-sm">
                                                دستگاهی ندارد
                                            </div>
                                        )}

                                        {devices.map((d, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between bg-black/50 border border-white/10 rounded-lg px-3 py-2"
                                            >
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Smartphone size={14} className="text-red-400" />
                                                    <span>{brands[i] || "-"}</span>
                                                    <span className="text-white/50">|</span>
                                                    <span>{d}</span>
                                                </div>
                                                <div className="flex gap-4 items-center justify-center h-full">
                                                    <button
                                                        onClick={() => setSelector(d)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <MapIcon size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            removeDevice(u.username, d, brands[i] || "")
                                                        }
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}