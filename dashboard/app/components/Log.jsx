import { useEffect, useState } from "react"
import { X } from "lucide-react";
export default function Log({ setOpenlog }) {
    const [datalogs, setDatalogs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://91.223.116.216:5004/api/logs/execute/device/home/esp32-gps?startDate=2026-04-06T09:00:00Z');
                const data = await response.json();
                setDatalogs(data.logs || []);
                setLoading(false);
            } catch (error) {
                console.error('Error:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen absolute">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    const gpsLogs = datalogs.filter(log => log.extra && log.extra.lat && log.extra.lon);

    return (
        <div className="min-h-screen bg-transparent p-4 w-full absolute z-[2000000000000000000000000000000000000] top-[1]">
            <X className="w-5 h-5 fixed left-[150] border-1 top-[25] pointer" onClick={() => {setOpenlog(false)}}/>
            <div className="max-w-6xl mx-auto">
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gpsLogs.map((log, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{log.messageType}</h3>
                                    <p className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    log.status === 'online' ? 'bg-green-100 text-green-800' :
                                    log.status === 'offline' ? 'bg-red-100 text-red-800' :
                                    'bg-green-100 text-green-800'
                                }`}>
                                    {log.status || 'Online'}
                                </span>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Location</p>
                                        <p className="font-medium text-blue-500">{log.extra.lat.toFixed(6)}, {log.extra.lon.toFixed(6)}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Speed</p>
                                        <p className="font-medium text-green-500">{log.extra.spd} km/h</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">LED Status</p>
                                        <p className={`font-medium ${log.extra.led === 'ON' ? 'text-red-600' : 'text-yellow-600'}`}>{log.extra.led}</p>
                                    </div>
                                </div>
                                
                                {log.extra.sats && (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Satellites</p>
                                            <p className="font-medium text-pink-500">{log.extra.sats}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {log.extra.alt && (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m6-12v4m2-2h4m-6 12h4m-6-2h4"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Altitude</p>
                                            <p className="font-medium text-blue-500">{log.extra.alt} m</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                {gpsLogs.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No GPS data available</h3>
                        <p className="text-gray-500">There are no GPS logs with location data to display.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

