"use client";
import { Download, Smartphone, ShieldCheck, Zap } from "lucide-react";

export default function Application() {
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[3000] w-[95%] max-w-[520px]">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_0_30px_rgba(255,0,0,0.35)]">
                <div className="absolute inset-0 pointer-events-none animate-pulse shadow-[0_0_40px_rgba(255,0,0,0.4)]" />

                <div className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center shadow-[0_0_18px_rgba(255,0,0,0.6)]">
                        <Smartphone className="text-red-500" size={24} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm sm:text-base">
                            دانلود اپلیکیشن اندروید
                        </div>

                        <div className="flex items-center gap-3 text-[11px] sm:text-xs text-white/60 mt-1">
                            <span className="flex items-center gap-1">
                                <ShieldCheck size={14} /> امن
                            </span>
                            <span className="flex items-center gap-1">
                                <Zap size={14} /> سریع
                            </span>
                            <span className="ml-1 text-white/40">Version 1.0.0</span>
                        </div>
                    </div>

                    <a
                        href="/application/kabir-motor.apk"
                        download
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-semibold shadow-[0_0_18px_rgba(255,0,0,0.7)] active:scale-95 transition"
                    >
                        <Download size={18} />
                        دانلود
                    </a>
                </div>
            </div>
        </div>
    );
}
