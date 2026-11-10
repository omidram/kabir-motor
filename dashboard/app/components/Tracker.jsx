"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useMap } from "react-leaflet";
import { LocateFixed, MotorbikeIcon, Layers, Route, MapIcon, LucideClockFading } from "lucide-react";
import Loading from "./Loading";
import Crash from "./Crash";
import Image from "next/image";
import neshanlogo from '../../public/icons/neshan.png'
import Log from "./Log";
import Temp from './Temp'


const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(m => m.Polyline), { ssr: false });

function MapEvents({ position, setMap, setOffCenter }) {
    const map = useMap();

    useEffect(() => {
        setMap(map);

        const check = () => {
            const center = map.getCenter();
            const dist = center.distanceTo(position);
            setOffCenter(dist > 60);
        };

        map.on("moveend", check);
        map.on("zoomend", check);

        return () => {
            map.off("moveend", check);
            map.off("zoomend", check);
        };
    }, [map, position]);

    return null;
}

export default function Tracker({ position, path = [], led, setSelector, mpu, user, temp }) {
    const [L, setL] = useState(null);
    const [map, setMap] = useState(null);
    const [offCenter, setOffCenter] = useState(false);
    const [openlog, setOpenlog] = useState(false);
    const [mapTheme, setMapTheme] = useState("satellite");
    const lastPositionRef = useRef(position);
    const [neshan, setNeshan] = useState(false)
    const urlencoded = new URLSearchParams();
    const [imageurl, setImageUrl] = useState('')

    useEffect(() => {
        if(!neshan) return;
      const requestOptions = {
  method: "GET",
  redirect: "follow"
};

fetch(`https://api.neshan.org/v4/static?key=service.20486e0cba0e496db138e906fa704dab&type=${led === 'ON' ? 'standard-night' : 'standard-day'}&width=2000&height=1200&zoom=17&center=${position[0]}%2C${position[1]}&markerToken=61641.ASRxe90HI`, requestOptions)
.then(res => res.blob())
  .then(blob => {
     const imgUrl = URL.createObjectURL(blob);
     setImageUrl(imgUrl);
  })
    }, [position])

    useEffect(() => {
        import("leaflet").then(setL);
    }, []);

    useEffect(() => {
        lastPositionRef.current = position;
    }, [position]);

    const rotation = useMemo(() => {
        if (path.length < 2) return 0;
        const [lat1, lon1] = path[path.length - 2];
        const [lat2, lon2] = path[path.length - 1];
        const toRad = d => (d * Math.PI) / 180;
        const toDeg = r => (r * 180) / Math.PI;
        const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
        const x =
            Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.cos(toRad(lon2 - lon1));
        const brng = toDeg(Math.atan2(y, x));
        return (brng + 360) % 360;
    }, [path]);

    const totalDistance = useMemo(() => {
        if (path.length < 2) return 0;
        const toRad = d => (d * Math.PI) / 180;
        let total = 0;
        for (let i = 1; i < path.length; i++) {
            const [lat1, lon1] = path[i - 1];
            const [lat2, lon2] = path[i];
            const R = 6371;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) *
                Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            total += R * c;
        }
        return total;
    }, [path]);

    const bikeIcon = useMemo(() => {
        if (!L) return null;
        return L.divIcon({
            html: `<div style="transform: rotate(${rotation}deg);transition:transform 0.2s linear;">
              <img src="/img/marker.png" style="width:42px;height:42px;display:block;" />
            </div>`,
            className: "",
            iconSize: [50, 50],
            iconAnchor: [21, 21],
        });
    }, [L, rotation]);

    const tileUrl = useMemo(() => {
        if (mapTheme === "satellite")
            return "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
        if (mapTheme === "minimal")
            return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
        if (led === "ON")
            return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    }, [mapTheme, led]);

    const recenter = () => {
        if (!map || !lastPositionRef.current) return;
        map.flyTo(lastPositionRef.current, map.getZoom(), { duration: 0.5 });
        setOffCenter(false);
    };

    if (!position || !bikeIcon) return <Loading />;

    return (
        <>
        {openlog ? <Log setOpenlog={setOpenlog}/> : 
        <div style={{height: '100vh'}} className="relative w-full">
            {openlog ? <Log /> : ''}
          {!neshan ?
                      <MapContainer center={position} zoom={16} style={{ width: "100%", height: "100%" }}>
                <MapEvents position={position} setMap={setMap} setOffCenter={setOffCenter} />
                <TileLayer attribution="© Kabir Motor" url={tileUrl} />

                {path.length > 1 && (
                    <Polyline
                        positions={path}
                        pathOptions={{
                            color: led === "ON" ? "#22c55e" : "#2563eb",
                            weight: 4,
                        }}
                    />
                )}

                <Marker position={position} icon={bikeIcon} />
            </MapContainer> : 
            <div className="h-[100vh] w-full">
              {imageurl && position ? <img style={{ width: "100%", height: "100%", pointerEvents: 'none' }} src={imageurl} alt="neshan map" /> : ''}
            </div>
            }

            <div className="absolute bottom-5 left-40 sm:left-1/2 -translate-x-1/2 z-[9999] px-3 py-2 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/20 text-white shadow-2xl flex items-center gap-3">
                <Route className="w-5 h-5 text-blue-400" />
                <p>مسافت طی شده</p>
                <span className="text-sm font-semibold tracking-wide">
                    {totalDistance < 1
                        ? `${(totalDistance * 1000).toFixed(0)} M`
                        : `${totalDistance.toFixed(2)} KM`}
                </span>
            </div>

            <button
                onClick={() =>{setOpenlog(openlog ? false : true)}
                }
                className="absolute pointer bottom-56 left-4 z-[9999] w-13 h-13 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-xl border border-white/30 text-white shadow-lg"
            >
                <LucideClockFading />
            </button>

            <button
                onClick={() =>
                  setNeshan(neshan ? false : true)
                }
                className="absolute pointer bottom-72 left-4 z-[9999] w-13 h-13 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-xl border border-white/30 text-white shadow-lg"
            >
                { neshan ? <MapIcon className="w-5 h-5" /> : <Image src={neshanlogo} alt="logo" width={35} height={35}/>}
            </button>

{neshan ?
'':
            <button
                onClick={() =>
                    setMapTheme(prev =>
                        prev === "standard"
                            ? "minimal"
                            : prev === "minimal"
                            ? "satellite"
                            : "standard"
                    )
                }
                className="absolute pointer bottom-24 left-4 z-[9999] w-13 h-13 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-xl border border-white/30 text-white shadow-lg"
            >
                <Layers className="w-5 h-5" />
            </button>}

            {offCenter && (
                <button
                    onClick={recenter}
                    className="absolute pointer bottom-96 left-4 z-[9999] w-13 h-13 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-xl border border-white/30 text-white shadow-lg"
                >
                    <LocateFixed className="w-5 h-5" />
                </button>
            )}

            <button
                onClick={() => setSelector("")}
                className="absolute pointer bottom-40 left-4 z-[9999] w-13 h-13 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-xl border border-white/30 text-white shadow-lg"
            >
                <MotorbikeIcon className="w-5 h-5" />
            </button>
            
        </div>
        }
        <Crash mpu={mpu} user={user} position={position}/>
        <Temp temp={temp}/>
        </>
    );
}