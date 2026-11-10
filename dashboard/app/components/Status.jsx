'use client'

import { useEffect, useState } from "react"
import { User, Satellite, Cpu, Gauge, Mountain, Clock } from "lucide-react"

export default function Status({ sat = 0, speed = 0, code = "---", alt = 0, user }) {
    const [time, setTime] = useState("")

    useEffect(() => {
        const updateTime = () => setTime(new Date().toLocaleTimeString())
        updateTime()
        const interval = setInterval(updateTime, 1000)
        return () => clearInterval(interval)
    }, [])

    if (!speed && !sat && !alt) return null

    const Item = ({ icon: Icon, label, value, color = "text-white" }) => (
        <div className="flex flex-col items-center sm:items-center gap-1">
            <div className="flex items-center gap-1 text-white/60 text-[10px] sm:text-xs">
                <Icon size={12} />
                {label}
            </div>
            <div className={`font-semibold text-sm sm:text-base ${color} truncate`}>
                {value}
            </div>
        </div>
    )

    return (
        <div className="
            fixed top-3 left-1/2 -translate-x-1/2
            z-[2000]
            backdrop-blur-xl bg-black/50
            border border-white/15
            shadow-2xl
            rounded-2xl
            px-4 py-3
            text-white
            w-[95%] max-w-[900px]
        ">
            <div className="
                grid grid-cols-2 gap-4 text-center
                sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-8
            ">
                <Item icon={User} label="USER" value={user?.username || "---"} />
                <Item icon={Satellite} label="SATELLITES" value={sat} color="text-cyan-400" />
                <Item icon={Cpu} label="DEVICE ID" value={code} />
                <Item icon={Gauge} label="SPEED" value={`${Math.round(speed)} km/h`} color="text-emerald-400" />
                <Item icon={Mountain} label="ALTITUDE" value={`${Math.round(alt)} m`} color="text-orange-400" />
                <Item icon={Clock} label="TIME" value={time} />
            </div>
        </div>
    )
}
