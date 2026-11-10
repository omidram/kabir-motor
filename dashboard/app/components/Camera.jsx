'use client'
import { useRef, useEffect, useState } from "react";
import { Camera as CameraIcon, Video, Square, Webcam } from "lucide-react";

export default function Camera({ stream, led }) {
    const [open, setOpen] = useState(false);

    useEffect( () => {
        try {
            fetch("http://91.223.116.216:6050/api/flashcontrol", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command: led === 'ON' ? "ON" : "OFF",
                    deviceType: "flash",
                    deviceId: "gr01",
                }),
            });
        } catch {
            console.error('error led')
        }
    }, [led])

    return (
        <>
            <button
                onClick={() => setOpen(o => !o)}
                className="
                fixed bottom-4 left-4 z-[20000]
                w-12 h-12 sm:w-14 sm:h-14
                rounded-full
                flex items-center justify-center
                bg-black/50 backdrop-blur-xl
                border border-emerald-400/40
                text-emerald-300
                shadow-lg active:scale-95 transition
            "
            >
                <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {open && (
                <div className="
                fixed bottom-20 left-3 sm:left-20 z-[20000]
                flex flex-col sm:flex-row gap-3
            ">
                    <CameraCard
                        title="دوربین جلو"
                        url={stream}
                    />
                    {/* <CameraCard
                        title="دوربین عقب"
                        url="http://91.223.116.216:8080/mjpeg/cam5"
                    /> */}
                </div>
            )}
        </>
    );
}

function CameraCard({ title, url }) {
    const imgRef = useRef(null);
    const canvasRef = useRef(null);
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const animationRef = useRef(null);

    const [recording, setRecording] = useState(false);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;
        img.src = `/api/mjpeg?url=${encodeURIComponent(url)}`;
    }, [url]);

    const startRecording = () => {
        if (recording) return;
        try {
            fetch("http://91.223.116.216:6050/api/flashcontrol", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command: "ON",
                    deviceType: "flash",
                    deviceId: "gr01",
                }),
            });
        } catch {
            console.error('error led')
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = 640;
        canvas.height = 360;

        const draw = () => {
            const img = imgRef.current;
            if (!img) return;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            animationRef.current = requestAnimationFrame(draw);
        };
        draw();

        const stream = canvas.captureStream(25);
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });

        chunksRef.current = [];

        recorder.ondataavailable = e => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            cancelAnimationFrame(animationRef.current);
            const blob = new Blob(chunksRef.current, { type: "video/webm" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${title}-${Date.now()}.webm`;
            a.click();
        };

        recorder.start();
        recorderRef.current = recorder;
        setRecording(true);
    };

    const stopRecording = () => {
        try {
            fetch("http://91.223.116.216:6050/api/flashcontrol", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command: "OFF",
                    deviceType: "flash",
                    deviceId: "gr01",
                }),
            });
        } catch {
            console.error('error led')
        }
        recorderRef.current?.stop();
        setRecording(false);
    };

    return (
        <div className="
        w-[220px] sm:w-[260px]
        rounded-2xl overflow-hidden
        bg-black/50 backdrop-blur-xl
        border border-emerald-400/30 shadow-lg
    ">
            <div className="flex justify-between items-center px-3 py-2 text-xs text-emerald-300 border-b border-emerald-400/20">
                <span>{title}</span>
                <span className="text-white flex justify-center items-center"><Webcam className="w-5 h-5"/>{url.split('/')[2]}</span>
                <span className="text-[10px]">
                    {recording ? "REC" : "LIVE"}
                </span>
            </div>
            {url ? 
                        <img style={{transform: 'scaleX(-1)'}}
                ref={imgRef}
                alt={title}
                className="w-full h-[130px] sm:h-[150px] object-cover"
                draggable={false}
            /> :
            <div className="h-[130px] sm:h-[150px] flex justify-center items-center"><div className="loading"></div></div>}

            <div className="flex gap-2 p-2">
                {!recording ? (
                    <button
                        onClick={startRecording}
                        className="flex-1 flex items-center justify-center gap-1
                        bg-red-500/20 border border-red-400 text-red-300
                        rounded-lg py-1 text-xs hover:bg-red-500/30 transition"
                    >
                        <Video className="w-3 h-3" />
                        Record
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        className="flex-1 flex items-center justify-center gap-1
                        bg-emerald-500/20 border border-emerald-400 text-emerald-300
                        rounded-lg py-1 text-xs hover:bg-emerald-500/30 transition"
                    >
                        <Square className="w-3 h-3" />
                        Stop
                    </button>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
