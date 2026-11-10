"use client";
import { Suspense, useMemo, useRef, useState, useEffect, Fragment } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

import {
    OrbitControls,
    useGLTF,
    Environment,
    useAnimations,
    useProgress,
} from "@react-three/drei";
import { ChevronLeft, ChevronRight, MapPinned, VanIcon } from "lucide-react";
import Application from "./Application";
import Loading3d from "./Loading3d";
import motordata from '../../public/motor.json'

function GarageModel() {
    const group = useRef();
    const { scene, animations } = useGLTF("/3d/garage.glb");
    const { actions } = useAnimations(animations, group);

    useEffect(() => {
        if (actions["Take 001"]) actions["Take 001"].reset().play();
    }, [actions]);

    return <primitive ref={group} object={scene} scale={6} position={[10, 1.4, 0]} />;
}

function Bike({ name }) {
    const ref = useRef();
    const { scene } = useGLTF(`/3d/${name}.glb`);

    useFrame((_, delta) => {
        if (ref.current) ref.current.rotation.y += delta * -0.5;
    });

    return (
        <group ref={ref}>
            <primitive object={scene} scale={10} />
        </group>
    );
}

function LoaderOverlay() {
    const { active } = useProgress();
    if (!active) return null;
    return <Loading3d />;
}

export default function Garage({ user, setSelector }) {
    const [open, setOpen] = useState(false);

  // قفل اسکرول هنگام باز بودن پاپ‌آپ
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);
    const motors = useMemo(() => {
        if (!user?.brand) return [];
        return user.brand.split(",").map(v => v.trim()).filter(Boolean);
    }, [user]);

    const devices = useMemo(() => {
        if (!user?.device_id) return [];
        return user.device_id.split(",").map(v => v.trim()).filter(Boolean);
    }, [user]);

    const [index, setIndex] = useState(0);

    if (!motors.length) {
        return (
            <div className="flex items-center justify-center w-full h-screen text-white/50">
                موتوری ثبت نشده
            </div>
        );
    }

    const currentMotor = motors[index];
    const currentDevice = devices[index] || "-";

    const next = () => setIndex(i => (i + 1) % motors.length);
    const prev = () => setIndex(i => (i - 1 + motors.length) % motors.length)
  const currentMotorKey = currentMotor
    .replace(/\s+/g, "_")   // فضای خالی → _
    .replace(/-/g, "_")     // '-' → _
    .toUpperCase();         // همه حروف بزرگ (یا .toLowerCase() اگر JSON به حروف کوچک است)

  const motorData = motordata[currentMotorKey];


    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            <LoaderOverlay />

            <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950 to-black" />

            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center text-white z-20">
                <div className="text-xl font-bold tracking-widest drop-shadow-[0_0_15px_red]">
                    {currentMotor}
                </div>
                <div className="text-xs text-white/60">Device: {currentDevice}</div>
            </div>

            {motors.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute pointer left-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-red-700/70 text-white p-3 rounded-full backdrop-blur shadow-[0_0_20px_red]"
                    >
                        <ChevronLeft size={26} />
                    </button>
                    <button
                        onClick={next}
                        className="absolute pointer right-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-red-700/70 text-white p-3 rounded-full backdrop-blur shadow-[0_0_20px_red]"
                    >
                        <ChevronRight size={26} />
                    </button>
                </>
            )}

            <Canvas
                camera={{ position: [5, 0, 14], fov: 70 }}
                gl={{ antialias: true, powerPreference: "high-performance" }}
                dpr={[1, 2]}
            >
                <ambientLight intensity={1} />
                <directionalLight position={[5, 8, 5]} intensity={1} />
                <pointLight position={[0, 3, 0]} intensity={5} color="#ff0000" />
                <spotLight position={[0, 10, 5]} angle={0.25} penumbra={1} intensity={2} />
                <GarageModel />
                <Suspense fallback={null}>
                    
                    <Bike key={currentMotor} name={currentMotor} />
                </Suspense>

                <Environment files="/potsdamer_platz_1k.hdr" background={true} />

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    minPolarAngle={Math.PI / 2}
                    maxPolarAngle={Math.PI / 2}
                />
            </Canvas>
    <>
      {/* دکمه باز کردن */}
      <button
        onClick={() => setOpen(true)}
        className="
          fixed bottom-30 right-4 z-[1000000]
          bg-red-600 text-white shadow-xl
          rounded-full w-14 h-14
          flex items-center justify-center
          active:scale-95 transition pointer
        "
      >
        <VanIcon size={30} />
      </button>

      {/* پس‌زمینه محو + پاپ‌آپ */}
      {open && (
        <div
          className="
            fixed inset-0 z-[2000000]
            bg-black/40 backdrop-blur-sm
            flex items-center justify-center
            animate-[fadeIn_0.25s_ease]
          "
        >
          <article
            className="
              w-[90%] max-w-sm
              bg-white/10 
              backdrop-blur-2xl 
              border border-white/20
              rounded-2xl shadow-2xl
              p-4
              animate-[popup_0.35s_ease]
              scroll
            "
            style={{
              background:
                "linear-gradient(135deg, rgba(255,80,80,0.45), rgba(255,255,255,0.35))",
            }}
          >
            {/* header */}
            <header className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white text-center flex-1">
                {currentMotor}
              </h3>

              {/* دکمه بستن */}
              <button
                onClick={() => setOpen(false)}
                className="text-white text-lg font-bold ml-2 active:scale-90 pointer"
              >
                ✕
              </button>
            </header>

            {/* data */}
            {motorData && Object.keys(motorData).length > 0 ? (
              <dl className="grid grid-cols-1 gap-2">
                {Object.entries(motorData).map(([key, value]) => {
                  const prettyKey = key.replace(/_/g, " ");
                  return (
                    <div
                      key={key}
                      className="
                      flex justify-between items-center
                      text-sm
                      bg-white/20 
                      rounded-lg
                      px-3 py-2
                      border border-white/10
                    "
                    >
                      <dt className="font-medium text-white">{prettyKey}:</dt>
                      <dd className="font-mono text-gray-900">{value}</dd>
                    </div>
                  );
                })}
              </dl>
            ) : (
              <div className="text-white text-sm text-center py-6">
                <svg className="animate-spin h-4 w-4 text-white mx-auto mb-2">
                  <path
                    fill="currentColor"
                    d="M12 4v4a4 4 0 0 1 4 4h4a8 8 0 0 0-8-8z"
                  />
                </svg>
                اطلاعات موتور در حال بارگذاری...
              </div>
            )}
          </article>
        </div>
      )}

      {/* انیمیشن‌ها */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }

          @keyframes popup {
            0%   { transform: scale(0.85); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </>




            <button
                onClick={() => setSelector(currentDevice)}
                className="fixed pointer bottom-30 left-1/2 -translate-x-1/2 z-[600000] flex items-center gap-2 p-3 sm:px-4 sm:py-2 rounded-full sm:rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_25px_rgba(0,100,255,0.6)] hover:scale-105 active:scale-95 transition"
            >
                <MapPinned size={18} />
                <span className="sm:inline font-medium">GPS Tracker</span>
            </button>

            <Application />
        </div>
    );
}

useGLTF.preload("/3d/garage.glb");