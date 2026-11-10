"use client";
import { useState } from "react";
import { Shield, ShieldCheck, Loader2 } from "lucide-react";

export default function Arm() {
    const [arm, setArm] = useState("DISARM");
    const [loading, setLoading] = useState(false);

    const toggle = async () => {
        if (loading) return;

        const next = arm === "DISARM" ? "ARM" : "DISARM";
        setArm(next);
        setLoading(true);

        try {
            await fetch("http://91.223.116.216:6050/api/cmd", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command: next,
                    deviceType: "mpu",
                    deviceId: "esp32-gps",
                }),
            });
        } catch {
            setArm(next === "ARM" ? "DISARM" : "ARM");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed left-4 top-7 sm:left-5 sm:top-20 z-[20000]">
            <button
                onClick={toggle}
                className={`
                    relative
                    w-[65px] h-[65px]
                    sm:w-[115px] sm:h-[115px]
                    rounded-full
                    flex flex-col items-center justify-center
                    text-white font-bold
                    backdrop-blur-2xl
                    pointer
                    border transition-all duration-300
                    active:scale-95
                    ${arm === "ARM"
                        ? "bg-red-500/20 border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.7)] sm:shadow-[0_0_35px_rgba(239,68,68,0.7)]"
                        : "bg-emerald-500/20 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.7)] sm:shadow-[0_0_35px_rgba(16,185,129,0.7)]"
                    }
                    ${loading && "animate-pulse cursor-not-allowed"}
                `}
            >
                <div className="absolute inset-0 rounded-full border border-white/10" />

                <div className="flex items-center justify-center">
                    {loading ? (
                        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                    ) : arm === "ARM" ? (
                        <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8" />
                    ) : (
                        <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
                    )}
                </div>

                <span className="text-[9px] sm:text-[11px] mt-1 tracking-wider opacity-90 text-center leading-tight px-1">
                    {loading
                        ? "در حال ارسال..."
                        : arm === "ARM"
                            ? "دزدگیر فعال"
                            : "دزدگیر خاموش"}
                </span>

                {/* {!loading && (
                    <span
                        className={`
                            absolute inset-0 rounded-full animate-ping
                            ${arm === "ARM" ? "bg-red-400/10" : "bg-emerald-400/10"}
                        `}
                    />
                )} */}
            </button>
        </div>
    );
}