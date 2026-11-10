"use client";
import { useEffect, useState, useRef } from "react";
import Tracker from "./components/Tracker";
import Speed from "./components/Speed";
import Status from "./components/Status";
import Camera from "./components/Camera";
import Locker from "./components/Locker";
import Arm from "./components/Arm";
import Loading from "./components/Loading";
import Auth from "./components/Auth";
import Logout from "./components/Logout";
import Image from "next/image";
import m1 from "../public/motors/m1.jpg";
import m2 from "../public/motors/m2.jpg";
import m3 from "../public/motors/m3.jpg";
import m4 from "../public/motors/m4.jpg";
import m5 from "../public/motors/m5.jpg";
import m6 from "../public/motors/m6.jpg";
import { useWebSocket } from "./context/WebSocketContext";
import Request from "./components/Request";
import Admin from "./components/Admin";
import Garage from "./components/Garage";

export default function Home() {
  const { socket } = useWebSocket();

  const slides = [m1, m2, m3, m4, m5, m6];
  const [slide, setSlide] = useState(0);

  const [login, setLogin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState(null);

  const [position, setPosition] = useState('');
  const [path, setPath] = useState([]);

  const [speed, setSpeed] = useState();
  const [sat, setSat] = useState();
  const [code, setCode] = useState("");
  const [relay, setRelay] = useState("");
  const [alt, setAlt] = useState();
  const [led, setLed] = useState('');
  const [signal, setSignal] = useState(false);
  const [distance, setDistance] = useState();
  const [selector, setSelector] = useState("");
  const [mpu, setMpu] = useState("");
  const [temp, setTemp] = useState([])
  const [stream, setStream] = useState('')
//[35.765264585971856, 51.313615730917846]
  const lastDataRef = useRef(null);
  const playedRef = useRef(false);

  useEffect(() => {
    slides.forEach((img) => {
      const i = new window.Image();
      i.src = img.src;
    });
    const interval = setInterval(() => {
      setSlide((s) => (s + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoadingAuth(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const now = Date.now() / 1000;

        if (payload.exp < now) {
          localStorage.removeItem("token");
          setLoadingAuth(false);
          return;
        }

        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        setUser(data.user);
        console.log(data.user)
        setLogin(true);
      } catch {
        localStorage.removeItem("token");
      }

      setLoadingAuth(false);
    };

    init();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!lastDataRef.current) return;
      const diff = Date.now() - lastDataRef.current;
      setSignal(diff < 20000);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!socket || !login) return;

    socket.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === "auth_ok") {
        socket.send(
          JSON.stringify({
            id: 1,
            type: "subscribe_events",
            event_type: "state_changed",
          })
        );
        return;
      }
console.log(msg)
      if (!selector) return;

      if (msg.messageType === "state" && msg.data.gps?.lat && msg.data.gps?.lon) {
        // if (msg.code !== selector) return;

        lastDataRef.current = Date.now();
        setSignal(true);

        if (!playedRef.current) {
          playedRef.current = true;
          const audio = new Audio("/sound/engine.mp3");
          audio.volume = 1;
          audio.play().catch(() => { });
        }

        const newPos = [msg.data.gps.lat, msg.data.gps.lon];
        setPosition(newPos);
        setSpeed(msg.data.gps.spd);
        setSat(msg.data.gps.sat);
        setRelay(msg.data.relay.fuel);
        setCode(msg.data.code);
        setAlt(msg.data.gps.alt);
        setLed(msg.data.relay.light);
        console.log(msg.data)
        setDistance(msg.data.distance_cm);
        setMpu(msg.data.mpu.event);
        setTemp([msg.data.SHT20.temp, msg.data.SHT20.hum])
        setPath((prev) => [...prev, newPos]);
      }
      if(msg.messageType === 'state' && msg.data.stream){
        setStream(msg.data.stream);
        console.log(msg)
      }
    };
  }, [socket, login, selector]);
  useEffect(() => {
    console.log(mpu)
  }, [mpu])

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-1">
        {slides.map((img, i) => (
          <Image
            key={i}
            src={img}
            alt="bg"
            fill
            priority
            className={`transition-opacity duration-1000 ${i === slide ? "opacity-100" : "opacity-0"
              }`}
          />
        ))}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      </div>

      {login ? (
        user.rule === "user" ? (
          <>
            <Logout />
            {!user.device_id ? (
              <Request user={user} />
            ) : !selector ? (
              <>
                <Request user={user} />
                <Garage user={user} setSelector={setSelector} />
              </>
            ) : (
              <>
                <Tracker
                  position={position}
                  path={path}
                  led={led}
                  setSelector={setSelector}
                  mpu={mpu}
                  user={user}
                  temp={temp}
                />
                {!signal && <Loading setSelector={setSelector}/>}
                {signal && (
                  <>
                    <Speed speed={speed} distance={distance} led={led} />
                    <Status
                      sat={sat}
                      speed={speed}
                      code={code}
                      alt={alt}
                      user={user}
                    />
                    <Camera stream={stream} led={led}/>
                    <Locker relay={relay} />
                    <Arm />
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <Logout />
            {selector ? (
              <>
                <Tracker
                  position={position}
                  path={path}
                  led={led}
                  setSelector={setSelector}
                  mpu={mpu}
                  user={user}
                  temp={temp}
                />

                {!signal && <Loading setSelector={setSelector}/>}

                {signal && (
                  <>
                    <Speed speed={speed} distance={distance} led={led} />
                    <Status
                      sat={sat}
                      speed={speed}
                      code={code}
                      alt={alt}
                      user={user}
                    />
                    <Camera />
                    <Locker relay={relay} />
                  </>
                )}
              </>
            ) : (
              <Admin setSelector={setSelector} />
            )}
          </>
        )
      ) : (
        <Auth setLogin={setLogin} setUser={setUser} />
      )}
    </div>
  );
}