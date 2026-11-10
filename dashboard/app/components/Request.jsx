"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
    Send,
    Bike,
    X,
    PlusCircle,
    CheckCircle2,
    AlertCircle,
    Camera,
} from "lucide-react";
import Application from "./Application";
const motors = [
    "APRILIA SR 160",
    "APRILIA SXR 160",
    "ARIES 155",
    "CDI 125",
    "CDI 150",
    "CDI 200",
    "CLICK UP 150",
    "CLICK UP 170 (NEWFACE)",
    "CLICK UP 170",
    "CLICK UP 180",
    "CT 125",
    "CTV 150",
    "CTV 180",
    "CTV 200",
    "HONEST 185",
    "Honest 249",
    "HONEST CB200X",
    "IRFZ-S 150",
    "KABIR 125",
    "Kabir 125H",
    "KABIR 150",
    "kabir 150P",
    "KABIR 200",
    "KABIR A1 249",
    "KLD 200",
    "KLD200 شکاری",
    "KMB 125",
    "KMC 200",
    "PEUGEOT DJANGO 150",
    "RISE NVX 150",
    "RISE NVX 170",
    "RISE NVX 180",
    "RISE VARIO 160",
    "SATLIS 170",
    "VESPA SXL 150",
    "VESPA VXL 150",
    "VXL 170"
];



export default function Request({ user }) {
    const hasDevice = user?.device_id && user?.brand;
    const [open, setOpen] = useState(!hasDevice);
    const [brand, setBrand] = useState("");
    const [deviceId, setDeviceId] = useState("");
    const [scanMode, setScanMode] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const scannerRef = useRef(null);
    const isScanningRef = useRef(false);

    const handleScan = (text) => {
        try {
            let fixed = text;

            if (text.includes("'")) {
                fixed = text
                    .replace(/'/g, '"')
                    .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
            }

            const parsed = JSON.parse(fixed);

            if (parsed.brand && parsed.code) {
                setBrand(parsed.brand);
                setDeviceId(parsed.code.toString());
                setScanMode(false);

                if (isScanningRef.current) {
                    scannerRef.current?.stop().catch(() => { });
                    isScanningRef.current = false;
                }

                navigator.vibrate?.(200);
            } else {
                setError("اطلاعات QR اشتباه است");
            }
        } catch {
            setError("QR نامعتبر است");
        }
    };

    useEffect(() => {
        if (!scanMode) return;

        let scanner;

        const start = async () => {
            const { Html5Qrcode } = await import("html5-qrcode");

            scanner = new Html5Qrcode("qr-reader");
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: 260 },
                (decodedText) => handleScan(decodedText)
            );

            isScanningRef.current = true;
        };

        start();

        return () => {
            if (scanner && isScanningRef.current) {
                scanner.stop().catch(() => { });
                isScanningRef.current = false;
            }
        };
    }, [scanMode]);

const submit = async () => {
    if (!brand || !deviceId || loading) return;

    setLoading(true);
    setError("");
    setDone(false);

    try {
        const res = await fetch("/api/request", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ brand, device_id: deviceId }),
        });

        let data = {};
        try {
            data = await res.json();
        } catch {}

        if (!res.ok) {
            if (res.status === 400) {
                setError(data?.error || "اطلاعات ارسال شده نامعتبر است");
            } else if (res.status === 401) {
                setError("لطفاً دوباره وارد حساب شوید");
            } else if (res.status === 403) {
                setError("دسترسی ندارید");
            } else if (res.status === 404) {
                setError("دستگاه پیدا نشد");
            } else if (res.status === 409) {
                setError("این دستگاه قبلاً ثبت شده");
            } else if (res.status >= 500) {
                setError("خطای سرور، بعداً تلاش کنید");
            } else {
                setError(data?.error || "خطا در ثبت درخواست");
            }
            return;
        }

        if (data?.error === "already requested") {
            setError("قبلاً درخواست داده‌اید");
            return;
        }

        if (data?.error === "invalid token") {
            setError("نشست شما منقضی شده، دوباره وارد شوید");
            return;
        }

        if (data?.error === "device not found") {
            setError("این دستگاه وجود ندارد");
            return;
        }

        setDone(true);
        setBrand("");
        setDeviceId("");

    } catch (err) {
        if (err.name === "TypeError") {
            setError("اتصال اینترنت برقرار نیست");
        } else {
            setError("خطا در ارتباط با سرور");
        }
    } finally {
        setLoading(false);
    }
};
    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="flex absolute top-4 right-4 z-[999999] items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_0_18px_rgba(255,0,0,0.6)] hover:scale-105 active:scale-95 transition"
            >
                <PlusCircle size={18} />
                <span className="hidden sm:inline">موتور جدید</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[50000000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
            <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_0_60px_rgba(255,0,0,0.4)] p-5">

                <button onClick={() => setOpen(false)} className="absolute top-3 left-3 text-white/70 hover:text-red-400">
                    <X size={22} />
                </button>

                <div className="flex items-center justify-center gap-2 text-white mb-4">
                    <Bike className="text-red-500 drop-shadow-[0_0_10px_red]" />
                    <h2 className="font-bold text-lg">اتصال موتور</h2>
                </div>

                {!brand && !scanMode && (
                    <>
                        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-red-600/20 to-black border border-red-500/30 text-center">
                            <div className="mb-2 text-white text-sm">
                                بارکد روی کارت موتور را اسکن کنید
                            </div>
                            <div className="flex justify-center">
                                <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                    <div className="grid grid-cols-4 gap-1">
                                        {Array.from({ length: 16 }).map((_, i) => (
                                            <div key={i} className={`w-3 h-3 ${Math.random() > 0.5 ? "bg-black" : "bg-white"}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setScanMode(true)}
                            className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_0_25px_rgba(255,0,0,0.6)] hover:scale-102 transition"
                        >
                            <Camera size={18} />
                            شروع اسکن
                        </button>
                    </>
                )}

                {scanMode && (
                    <div className="flex justify-center mb-4">
                        <div className="relative w-72 h-72 rounded-2xl overflow-hidden border border-red-500 shadow-[0_0_30px_rgba(255,0,0,0.7)]">

                            <div id="qr-reader" className="w-full h-full" />

                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 border-2 border-red-500 rounded-2xl" />
                                <div className="absolute w-full h-1 bg-red-500 animate-[scan_2s_linear_infinite]" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-40 h-40 border-2 border-white/30 rounded-xl animate-pulse" />
                                </div>
                            </div>

                            <style jsx global>{`
                #qr-reader {
                    position: relative;
                }

                #qr-reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    border-radius: 16px;
                }

                #qr-reader canvas {
                    display: none !important;
                }

                #qr-reader__dashboard_section {
                    display: none !important;
                }

                @keyframes scan {
                    0% { top: 0 }
                    100% { top: 100% }
                }
            `}</style>
                        </div>
                    </div>
                )}

                {brand && (
                    <div className="mt-4 p-4 rounded-xl bg-black/70 border border-red-500/30 text-center animate-fadeIn">
                        <div className="relative h-36 w-full mb-3">
                            <Image src={`/motor/${brand}.png`} alt={brand} fill className="object-contain" />
                        </div>
                        <div className="text-white">{brand}</div>
                        <div className="text-red-400 text-sm mt-1">ID: {deviceId}</div>

                        <button
                            onClick={submit}
                            disabled={loading}
                            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_0_25px_rgba(255,0,0,0.7)]"
                        >
                            <Send size={18} />
                            {loading ? "در حال ارسال..." : "ثبت درخواست"}
                        </button>
                    </div>
                )}

                {done && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-green-400 text-sm">
                        <CheckCircle2 size={18} />
                        ثبت شد
                    </div>
                )}

                {error && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-red-400 text-sm">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

            </div>
            <Application />
        </div>
    );
}