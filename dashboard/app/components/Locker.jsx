"use client";
import { useEffect, useState } from "react";
import { Lock, Zap, Loader2 } from "lucide-react";

export default function Locker({ relay = "OFF" }) {
    const [locked, setLocked] = useState(relay === "OFF");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLocked(relay === "OFF");
    }, [relay]);

    const togglePower = async () => {
        if (loading) return;

        const nextLocked = !locked;
        setLocked(nextLocked);
        setLoading(true);

        try {
            await fetch("http://91.223.116.216:6050/api/control", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command: nextLocked ? "OFF" : "ON",
                    deviceType: "relay",
                    deviceId: "gr01",
                }),
            });
        } catch {
            setLocked(!nextLocked);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed right-4 top-7 sm:right-5 sm:top-20 z-[20000]">
            <button
                onClick={togglePower}
                className={`
                    relative
                    w-[65px] h-[65px]
                    sm:w-[115px] sm:h-[115px]
                    rounded-full
                    flex flex-col items-center justify-center
                    text-white font-bold
                    backdrop-blur-2xl
                    border transition-all duration-300
                    active:scale-95
                    pointer
                    ${locked
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
                    ) : locked ? (
                        <Lock className="w-6 h-6 sm:w-8 sm:h-8" />
                    ) : (
                        <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
                    )}
                </div>

                <span className="text-[9px] sm:text-[11px] mt-1 tracking-wider opacity-90 text-center leading-tight px-1">
                    {loading
                        ? "در حال ارسال..."
                        : locked
                            ? "برق قطع"
                            : "موتور روشن"}
                </span>

                {/* {!loading && (
                    <span
                        className={`
                            absolute inset-0 rounded-full animate-ping
                            ${locked ? "bg-red-400/10" : "bg-emerald-400/10"}
                        `}
                    />
                )} */}
            </button>
        </div>
    );
}
