"use client"
import { useEffect, useState } from "react"
import { Siren, ShieldAlert, Ambulance, Check } from "lucide-react"
import Image from "next/image"
import emergencyimage from "../../public/img/emergency.png"
import { scale } from "framer-motion"

export default function Crash({ mpu, user, position }) {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sendAmbulance, setSendAmbulance] = useState(false)
  const [audio] = useState(
    typeof Audio !== "undefined" ? new Audio("/sound/crash.mp3") : null
  )

  useEffect(() => {
    if (mpu === "crash_or_fall") {
      setShow(true)
      if (audio) {
        audio.currentTime = 0
        audio.play()
      }
    }
    else(setShow(false))
  }, [mpu, audio])

  const handleConfirm = async () => {
    setLoading(true)
    const message = `راننده موتور با مشخصات زیر:
         نام: ${user.firstname}
         نام خانوادگی: ${user.lastname}
         موبایل: ${user.phone}
         در مختصات:
         lat: ${position[0]},
         long: ${position[1]},
         map: https://map.ir/lat/${position[0]}/lng/${position[1]}/z/18
         تصادف کرده است.
         نیاز به آمبولانس: ${sendAmbulance ? 'دارد' : 'ندارد'}`

    await fetch(`https://sms.parsgreen.ir/UrlService/sendSMS.ashx?from=10001391&to=09356197570&text=${message}&signature=F0B12D4D-0A8E-4E71-B3DD-11956C688D59`, {
      method: "GET",
      // headers: {
      //   "Content-Type": "application/json"
      // },
      // body: JSON.stringify({
      //   message: `راننده موتور با مشخصات زیر:
      //   نام: ${user.firstname}
      //   نام خانوادگی: ${user.lastname}
      //   موبایل: ${user.phone}
      //   در مختصات:
      //   lat: ${position[0]},
      //   long: ${position[1]},
      //   map: https://map.ir/lat/${position[0]}/lng/${position[1]}/z/18
      //   تصادف کرده است.
      //   نیاز به آمبولانس: ${sendAmbulance ? 'دارد' : 'ندارد'}`,
      //   firstname: user.firstname,
      //   lastname: user.lastname,
      //   phone: user.phone,
      //   ambulance: sendAmbulance
      // })
    })

    setLoading(false)
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-5 z-[99999999999]">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-2xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.4)] border border-white/40 p-6 flex flex-col gap-6 animate-in fade-in zoom-in duration-300">

        <div className="flex items-center justify-center gap-2 text-red-600 font-extrabold text-lg tracking-wide">
          <Siren className="w-6 h-6 animate-pulse" />
          <span>تصادف تشخیص داده شد</span>
        </div>

        <div className="relative w-full h-20 flex items-center justify-center">
          <div className="absolute inset-0 flex">
            <div className="w-1/2 bg-gradient-to-b from-blue-500/10 to-blue-500/30 blur-xl" />
            <div className="w-1/2 bg-gradient-to-b from-red-500/10 to-red-500/30 blur-xl" />
          </div>

          <div className="relative z-10 flex items-center justify-between w-full px-2">

            <div className="flex flex-col items-center gap-2 -rotate-6">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-400/30 shadow-md">
                <ShieldAlert className="w-8 h-8 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-blue-700">اورژانس</span>
            </div>

            <div className="relative w-32 h-32 flex items-center justify-center">
              <Image
                src={emergencyimage}
                alt="emergency"
                className={`w-full h-full object-contain drop-shadow-2xl ${
  sendAmbulance ? "scale-100" : "scale-80"
}`}
              />

              {/* <div
                className={`absolute inset-0 transition-all duration-500 ${
                  sendAmbulance ? "opacity-0" : "opacity-70"
                } bg-black rounded-2xl`}
              /> */}
            </div>

            <div className="flex flex-col items-center gap-2 rotate-6">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-400/30 shadow-md">
                <Ambulance className="w-8 h-8 text-red-600" />
              </div>
              <span className="text-xs font-bold text-red-700">پلیس</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 bg-white/60 rounded-2xl p-3 border border-white/40 shadow-inner">
          <input
            type="checkbox"
            checked={sendAmbulance}
            onChange={(e) => setSendAmbulance(e.target.checked)}
            className="w-5 h-5 accent-green-500"
          />
          <span className="text-sm font-medium text-gray-800">
            اطلاع به اورژانس هم ارسال شود
          </span>
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-700 text-white font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition"
        >
          <Check className="w-5 h-5" />
          {loading ? "در حال ارسال..." : "تایید و ارسال"}
        </button>

      </div>
    </div>
  )
}