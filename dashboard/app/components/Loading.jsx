import Image from "next/image";
import loadingimage from "../../public/img/kabirmotor.png";
import Application from "./Application";
import { MotorbikeIcon } from "lucide-react";

export default function Loading({setSelector}) {
    return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center from-black via-red-950 to-black overflow-hidden">

            {/* 🔴 Red Glow Background */}
            <div className="absolute w-[700px] h-[700px] rounded-full bg-red-600/20 blur-[120px] animate-pulse" />

            {/* 🔳 Glass Card */}
            <div className="relative flex flex-col items-center gap-6 backdrop-blur-2xl bg-white/5 border border-red-500/30 rounded-3xl px-12 py-14 shadow-[0_0_60px_rgba(255,0,0,0.35)]">

                {/* 🔥 Logo */}
                <div className="relative w-[280px] h-[100px]" style={{ pointerEvents: 'none' }}>
                    <Image
                        src={loadingimage}
                        alt="logo"
                        width={300}
                        height={300}
                        priority
                        className="drop-shadow-[0_0_25px_rgba(255,0,0,0.7)] mt-[5px]"
                    />
                </div>

                {/* 🏍️ Speed Spinner */}
                <div className="relative">
                    <div className="w-12 h-12 border-[3px] border-red-500/30 rounded-full" />
                    <div className="absolute inset-0 w-12 h-12 border-[3px] border-red-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,0,0,0.7)]" />
                </div>

                {/* Text */}
                <p className="text-white/80 text-sm tracking-[0.25em] font-semibold">
                    CONNECTING TO GPS...
                </p>
            </div>

            {/* Version */}
            {/* <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/40 tracking-widest font-mono">
                Version 1.0.0
            </div> */}
            <Application />
            <button onClick={() => {setSelector('')}} className="fixed top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-red-600 hover:border-red-500 transition-all duration-300 shadow-lg active:scale-95">
                <span>Garage</span>
                <MotorbikeIcon />
            </button>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out;
                }
            `}</style>
        </div>
    );
}
