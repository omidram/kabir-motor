"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Application from "../components/Application";
import kabirmotorimage from "../../public/img/kabirmotor.png";

export default function Auth({ setLogin, setUser }) {
    const [mode, setMode] = useState("login");

    const [form, setForm] = useState({
        username: "",
        firstname: "",
        lastname: "",
        password: "",
        confirm: "",
        phone: "",
        email: "",
        code: ""
    });

    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [codeSent, setCodeSent] = useState(false);

    const handleChange = (e) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2000);
    };

    const isIranPhone = (p) => /^09\d{9}$/.test(p);

    const strongPassword = (p) =>
        p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);

    useEffect(() => {
        if (!cooldown) return;
        const t = setInterval(() => setCooldown((c) => c - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const sendCode = async () => {
        if (!isIranPhone(form.phone)) return showToast("شماره اشتباهه", "error");
        if (cooldown || sending) return;

        setSending(true);

        try {
            const res = await fetch("/api/auth/send-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: form.phone })
            });

            const data = await res.json();

            if (res.ok) {
                setCodeSent(true);
                setCooldown(120);
                showToast("کد ارسال شد");
            } else {
                showToast(data.error || "خطا", "error");
            }
        } catch {
            showToast("خطای سرور", "error");
        } finally {
            setSending(false);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        if (loading) return;

        if (mode === "register") {
            if (!codeSent) return showToast("کد رو بگیر", "error");
            if (!form.code) return showToast("کد رو وارد کن", "error");
            if (form.password !== form.confirm) return showToast("پسورد یکی نیست", "error");
            if (!strongPassword(form.password)) return showToast("پسورد ضعیفه", "error");
            if (!isIranPhone(form.phone)) return showToast("شماره نامعتبره", "error");
        }

        setLoading(true);

        try {
            const res = await fetch(
                mode === "login" ? "/api/auth/login" : "/api/auth/register",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form)
                }
            );

            const data = await res.json();
            console.log(data)

            if (res.ok && data.token) {
                localStorage.setItem("token", data.token);
                setUser(data.user);
                setTimeout(() => setLogin(true), 500);
                showToast("ورود موفق");
            } else {
                showToast(data.error || "خطا", "error");
            }
        } catch {
            showToast("خطا", "error");
        } finally {
            setLoading(false);
        }
    };

    const progress = (cooldown / 120) * 100;

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-transparent text-white px-3 py-5">

            {toast && (
                <div className={`fixed top-5 px-4 py-2 rounded-xl text-sm z-[9999] animate-pulse
                ${toast.type === "error" ? "bg-red-600" : "bg-white text-black"}`}>
                    {toast.msg}
                </div>
            )}

            <div className="w-full max-w-[450px] bg-white/5 p-10 rounded-3xl border border-red-500/30 backdrop-blur-xl animate-fadeIn">

                <div className="flex justify-center mb-3 animate-bounce">
                    <Image src={kabirmotorimage} alt="kabir motor" width={100} height={100} />
                </div>

                <h2 className="text-center font-bold mb-4 tracking-widest animate-pulse">
                    {mode === "login" ? "LOGIN" : "REGISTER"}
                </h2>

                <form onSubmit={submit} className="flex flex-col gap-2">

                    {mode === "login" ? (
                        <>
                            <input className="input" name="username" placeholder="Username" onChange={handleChange} />
                            <input className="input" name="password" type="password" placeholder="Password" onChange={handleChange} />
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <input className="input" name="username" placeholder="Username" onChange={handleChange} />
                                <input className="input" name="firstname" placeholder="FirstName" onChange={handleChange} />
                                <input className="input" name="lastname" placeholder="LastName" onChange={handleChange} />
                                <input className="input" name="email" placeholder="Email" onChange={handleChange} />
                            </div>

                            <div className="flex gap-2 items-center">
                                <input className="input w-full" name="phone" placeholder="09xxxxxxxxx" onChange={handleChange} />

                                <button
                                    type="button"
                                    onClick={sendCode}
                                    disabled={cooldown || sending}
                                    className="bg-red-600 px-3 py-2 rounded-xl text-xs flex items-center justify-center min-w-[90px]"
                                >
                                    {sending ? (
                                        <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                                    ) : cooldown ? (
                                        `${cooldown}s`
                                    ) : (
                                        "Send"
                                    )}
                                </button>
                            </div>

                            {codeSent && (
                                <input className="input animate-fadeIn" name="code" placeholder="Enter Code" onChange={handleChange} />
                            )}
                            {cooldown > 0 && (
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <input className="input" name="password" type="password" placeholder="Password" onChange={handleChange} />
                                <input className="input" name="confirm" type="password" placeholder="Confirm Password" onChange={handleChange} />
                            </div>
                        </>
                    )}

                    <button className="bg-red-600 py-2 rounded-xl mt-2 hover:scale-105 transition">
                        {loading ? "..." : mode === "login" ? "LOGIN" : "REGISTER"}
                    </button>
                </form>

                <p
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
                    className="text-center text-sm mt-4 opacity-70 cursor-pointer hover:opacity-100 transition"
                >
                    Switch
                </p>
            </div>

            <Application />

            <style jsx>{`
                .input {
                    padding: 10px;
                    background: rgba(0,0,0,0.4);
                    border-radius: 12px;
                    outline: none;
                    border: 1px solid rgba(255,0,0,0.3);
                    font-size: 13px;
                    transition: 0.2s;
                }
                .input:focus {
                    transform: scale(1.02);
                    border-color: red;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}