'use client'

import { useEffect, useState } from 'react'
import { Gauge, Lightbulb, Radar } from 'lucide-react'

export default function Speed({ speed = 0, distance = 0, led = 'OFF' }) {
    const maxSpeed = 180
    const [boot, setBoot] = useState(true)
    const [displaySpeed, setDisplaySpeed] = useState(0)

    useEffect(() => {
        let raf: any
        let start = performance.now()

        const animateBoot = (t: number) => {
            const p = Math.min((t - start) / 1200, 1)
            const fake = Math.sin(p * Math.PI) * maxSpeed
            setDisplaySpeed(p < 1 ? fake : speed)
            if (p < 1) raf = requestAnimationFrame(animateBoot)
            else {
                setBoot(false)
                setDisplaySpeed(speed)
            }
        }

        raf = requestAnimationFrame(animateBoot)
        return () => cancelAnimationFrame(raf)
    }, [])

    useEffect(() => {
        if (!boot) setDisplaySpeed(speed)
    }, [speed, boot])

    const percent = Math.min(displaySpeed / maxSpeed, 1)
    const radius = 90
    const circumference = 2 * Math.PI * radius
    const offset = circumference - percent * circumference

    return (
        <div className="fixed bottom-5 right-1 sm:bottom-8 sm:right-4 z-[20000]">
            <div className="relative w-40 h-40 sm:w-50 sm:h-50 flex items-center justify-center scale-[0.9] sm:scale-100">

                <div className={`absolute inset-0 rounded-full bg-black/80 backdrop-blur-2xl border border-white/10 transition-all duration-700 ${boot ? 'shadow-[0_0_80px_rgba(255,0,0,0.8)]' : 'shadow-[0_0_40px_rgba(255,0,0,0.4)]'}`} />

                <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 220 220">
                    <circle cx="110" cy="110" r={radius} strokeWidth="14" className="stroke-white/20" fill="transparent" />
                    <circle
                        cx="110"
                        cy="110"
                        r={radius}
                        strokeWidth="14"
                        fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-300 ease-out stroke-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.9)]"
                    />
                </svg>

                <div className="relative text-center text-white flex flex-col items-center gap-1">
                    <Gauge size={18} className="text-red-500 animate-pulse" />
                    <div className="text-5xl sm:text-6xl font-extrabold tracking-wider text-white drop-shadow-[0_0_12px_rgba(255,0,0,0.9)]">
                        {Math.round(displaySpeed)}
                    </div>
                    <div className="text-[10px] sm:text-xs tracking-[4px] text-gray-300">KM/H</div>
                </div>

                <div className="absolute -top-7 sm:-top-7 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/70 border border-white/10 backdrop-blur-xl">
                    <Lightbulb size={14} className={led === 'ON' ? 'text-red-500 drop-shadow-[0_0_8px_red]' : 'text-white/40'} />
                    <span className={`text-[10px] sm:text-xs font-bold tracking-widest ${led === 'ON' ? 'text-red-400' : 'text-white/40'}`}>
                        {led}
                    </span>
                </div>

                <div className="absolute -bottom-7 sm:-bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/70 border border-white/10 backdrop-blur-xl">
                    <Radar size={14} className="text-red-400 animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-bold text-white tracking-widest">
                        {distance === 999.9 ? '' : distance} m
                    </span>
                </div>
            </div>
        </div>
    )
}
