"use client";
import { LogOut } from "lucide-react";

export default function Logout() {
    const logout = () => {
        localStorage.removeItem("token");
        window.location.reload();
    };

    return (
        <button
            onClick={logout}
            className="
            z-1000000
        fixed top-4 left-4
        flex items-center gap-2
        px-3 py-2
        rounded-xl
        bg-black/60 backdrop-blur-md
        border border-white/20
        text-white
        hover:bg-red-600 hover:border-red-500
        transition-all duration-300
        shadow-lg
        active:scale-95
        pointer
      "
        >
            <LogOut size={18} />
            <span className="hidden sm:inline text-sm font-medium">Logout</span>
        </button>
    );
}
