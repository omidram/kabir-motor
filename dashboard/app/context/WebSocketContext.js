"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";


const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
    const socketRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    // const BASE_URL = 'http://91.223.116.249:8123';
    // const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwZWYwYjdmZGJjZjE0MjQ1YjYyYjI4ZTY3ODE2YTIxOSIsImlhdCI6MTc1NDM5ODg4MSwiZXhwIjoyMDY5NzU4ODgxfQ.23wNTd0JbJHiW3c-lqp4ehtT2Gi2s5MeGcYNMFU9ZfM';
    const BASE_URL = "http://91.223.116.216:6050"
    // const BASE_URL = "http://192.168.88.52:6050"
    const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwZWYwYjdmZGJjZjE0MjQ1YjYyYjI4ZTY3ODE2YTIxOSIsImlhdCI6MTc1NDM5ODg4MSwiZXhwIjoyMDY5NzU4ODgxfQ.23wNTd0JbJHiW3c-lqp4ehtT2Gi2s5MeGcYNMFU9ZfM'

    const wsUrl = `${BASE_URL.replace(/^http/, "ws")}/ws`;

    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                console.log("[WSS] Connected, sending auth");
                setIsConnected(true);
                ws.send(JSON.stringify({ type: "auth", access_token: TOKEN }));
            };

            ws.onclose = (evt) => {
                setIsConnected(false);
                console.warn(`[WSS] Closed (${evt.code}), reconnecting in 3s`);
                if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [wsUrl, TOKEN]);

    return (
        <WebSocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export const useWebSocket = () => useContext(WebSocketContext);