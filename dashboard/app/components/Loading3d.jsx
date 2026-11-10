"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Loading3d() {
    const [stage, setStage] = useState("INITIALIZING");

    useEffect(() => {
        const stages = [
            "INITIALIZING SYSTEM",
            "LOADING 3D ENVIRONMENT",
            "SYNCING DEVICES",
            "OPTIMIZING PERFORMANCE",
            "PREPARING INTERFACE",
        ];

        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % stages.length;
            setStage(stages[i]);
        }, 1200);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-transparent overflow-hidden">
            <div className="absolute w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[150px] animate-pulse" />

            <div className="relative w-[420px] max-w-[90%] rounded-3xl border border-red-200 bg-white/80 backdrop-blur-2xl shadow-[0_0_80px_rgba(255,0,0,0.25)] p-10 flex flex-col items-center gap-8">

                <div className="relative w-28 h-28">
                    <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
                    <div className="absolute inset-4 rounded-full bg-red-50 flex items-center justify-center">
                        <Image
                            src="/img/loading.gif"
                            alt="loading"
                            fill
                            className="object-contain scale-400"
                            unoptimized
                        />
                    </div>
                </div>

                <div className="text-sm text-red-500 font-semibold tracking-[0.25em] animate-pulse text-center">
                    {stage}
                </div>

                <div className="grid grid-cols-2 gap-4 w-full text-[11px] text-gray-600 tracking-wide">
                    <div className="flex justify-between">
                        <span>ENGINE</span>
                        <span className="text-red-500 font-semibold animate-pulse">ONLINE</span>
                    </div>
                    <div className="flex justify-between">
                        <span>RENDERER</span>
                        <span className="text-red-500 font-semibold animate-pulse">ACTIVE</span>
                    </div>
                    <div className="flex justify-between">
                        <span>NETWORK</span>
                        <span className="text-red-500 font-semibold animate-pulse">SYNCED</span>
                    </div>
                    <div className="flex justify-between">
                        <span>GPU MODE</span>
                        <span className="text-red-500 font-semibold animate-pulse">HIGH</span>
                    </div>
                </div>

                <div className="text-[10px] text-gray-400 tracking-[0.5em] animate-pulse">
                    GARAGE SYSTEM BOOT
                </div>
            </div>
        </div>
    );
}