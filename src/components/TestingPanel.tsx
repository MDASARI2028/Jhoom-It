"use client";

import { useStore } from "@/store/useStore";
import { useState, useEffect } from "react";

export default function TestingPanel() {
    const { leftGesture, rightGesture } = useStore();
    const [lastApiCall, setLastApiCall] = useState<string>("");
    const [lastApiStatus, setLastApiStatus] = useState<string>("");
    const [apiCallLog, setApiCallLog] = useState<Array<{ time: string; action: string; status: string }>>([]);


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
        <div className="fixed bottom-4 right-4 z-50 w-56 bg-black/90 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-md font-mono text-[10px] shadow-lg">
            <h3 className="text-cyan-400 font-bold mb-2 border-b border-cyan-500/20 pb-1 flex justify-between items-center">
                <span>TESTING PANEL</span>
                <span className="text-[9px] opacity-50">DEBUG</span>
            </h3>

            {/* Compact Gesture Grid */}
            <div className="mb-2 grid grid-cols-2 gap-2">
                <div className="bg-gray-900/50 p-1.5 rounded text-center">
                    <div className="text-gray-500 text-[8px] uppercase">Left</div>
                    <div className={`text-xs font-bold ${leftGesture !== 'IDLE' ? 'text-green-400' : 'text-gray-500'}`}>
                        {leftGesture}
                    </div>
                </div>
                <div className="bg-gray-900/50 p-1.5 rounded text-center">
                    <div className="text-gray-500 text-[8px] uppercase">Right</div>
                    <div className={`text-xs font-bold ${rightGesture !== 'IDLE' ? 'text-green-400' : 'text-gray-500'}`}>
                        {rightGesture}
                    </div>
                </div>
            </div>

            {/* Last API Call (Compact) */}
            <div className="mb-2 bg-gray-900/30 p-2 rounded border border-white/5">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-cyan-300 text-[9px]">LAST ACTION</span>
                    <span className="text-yellow-400 font-bold text-xs">{lastApiCall || '-'}</span>
                </div>
                <div className={`text-[9px] truncate ${lastApiStatus.includes('success') ? 'text-green-500' : 'text-gray-500'}`}>
                    {lastApiStatus || 'Waiting...'}
                </div>
            </div>

            {/* Recent Calls (Limited to 3) */}
            <div>
                <div className="text-cyan-300 text-[9px] mb-1 opacity-70">HISTORY</div>
                <div className="space-y-1">
                    {apiCallLog.slice(0, 3).map((log, i) => (
                        <div key={i} className="flex justify-between items-center bg-white/5 p-1 rounded text-[8px]">
                            <span className="text-gray-500">{log.time}</span>
                            <span className="text-white/90">{log.action}</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${log.status.includes('success') ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                    ))}
                    {apiCallLog.length === 0 && <div className="text-gray-700 italic text-[9px]">Empty</div>}
                </div>
            </div>
        </div>
    );
}
