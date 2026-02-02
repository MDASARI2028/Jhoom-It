"use client";

import { useStore } from "@/store/useStore";
import { useState, useEffect } from "react";

export default function TestingPanel() {
    const { leftGesture, rightGesture } = useStore();
    const [lastApiCall, setLastApiCall] = useState<string>("");
    const [lastApiStatus, setLastApiStatus] = useState<string>("");
    const [apiCallLog, setApiCallLog] = useState<Array<{ time: string; action: string; status: string }>>([]);

    // Listen for API call events (we'll dispatch these from GestureController)
    useEffect(() => {
        const handleApiEvent = (event: CustomEvent) => {
            const { action, status } = event.detail;
            const time = new Date().toLocaleTimeString();
            setLastApiCall(action);
            setLastApiStatus(status);
            setApiCallLog(prev => [{ time, action, status }, ...prev].slice(0, 5));
        };

        window.addEventListener('spotifyApiCall' as any, handleApiEvent);
        return () => window.removeEventListener('spotifyApiCall' as any, handleApiEvent);
    }, []);

    return (
        <div className="fixed bottom-10 right-10 z-50 w-80 bg-black/80 border border-cyan-500/50 rounded-lg p-4 backdrop-blur-md font-mono text-xs">
            <h3 className="text-cyan-400 font-bold mb-3 border-b border-cyan-500/30 pb-1">
                🧪 TESTING PANEL
            </h3>

            {/* Gesture Detection Status */}
            <div className="mb-3">
                <div className="text-cyan-300 text-[10px] mb-1">GESTURE DETECTION</div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-900/50 p-2 rounded">
                        <div className="text-gray-400 text-[9px]">LEFT HAND</div>
                        <div className={`text-sm font-bold ${leftGesture !== 'IDLE' ? 'text-green-400' : 'text-gray-600'}`}>
                            {leftGesture}
                        </div>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded">
                        <div className="text-gray-400 text-[9px]">RIGHT HAND</div>
                        <div className={`text-sm font-bold ${rightGesture !== 'IDLE' ? 'text-green-400' : 'text-gray-600'}`}>
                            {rightGesture}
                        </div>
                    </div>
                </div>
            </div>

            {/* Last API Call */}
            <div className="mb-3">
                <div className="text-cyan-300 text-[10px] mb-1">LAST API CALL</div>
                <div className="bg-gray-900/50 p-2 rounded">
                    <div className="text-yellow-400 font-bold">{lastApiCall || 'None'}</div>
                    <div className={`text-[10px] mt-1 ${lastApiStatus.includes('success') ? 'text-green-400' :
                            lastApiStatus.includes('403') ? 'text-orange-400' :
                                lastApiStatus.includes('404') ? 'text-red-400' : 'text-gray-400'
                        }`}>
                        {lastApiStatus || 'Waiting...'}
                    </div>
                </div>
            </div>

            {/* API Call Log */}
            <div>
                <div className="text-cyan-300 text-[10px] mb-1">RECENT CALLS</div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                    {apiCallLog.length === 0 ? (
                        <div className="text-gray-600 text-[10px] italic">No API calls yet</div>
                    ) : (
                        apiCallLog.map((log, i) => (
                            <div key={i} className="bg-gray-900/50 p-1.5 rounded text-[9px]">
                                <span className="text-gray-500">{log.time}</span>
                                <span className="text-yellow-400 mx-1">{log.action}</span>
                                <span className={
                                    log.status.includes('success') ? 'text-green-400' :
                                        log.status.includes('403') ? 'text-orange-400' : 'text-red-400'
                                }>
                                    {log.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Status Indicators */}
            <div className="mt-3 pt-3 border-t border-cyan-500/30 text-[9px] space-y-1">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-400">Detection Working</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${lastApiCall ? 'bg-yellow-400' : 'bg-gray-600'}`}></div>
                    <span className="text-gray-400">API Calls Active</span>
                </div>
            </div>
        </div>
    );
}
