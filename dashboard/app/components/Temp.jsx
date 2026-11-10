"use client";
import { Thermometer, Droplets } from "lucide-react";

export default function Temp({ temp }) {
  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-500000000000">
      <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl px-4 py-3 w-28 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Thermometer className="w-5 h-5 text-red-400" />
          <span className="text-sm font-medium">
            {Math.floor(temp?.[0] ?? 0)}°C
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium">
            {Math.floor(temp?.[1] ?? 0)}%
          </span>
        </div>
      </div>
    </div>
  );
}