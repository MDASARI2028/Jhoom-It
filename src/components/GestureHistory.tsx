"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";

interface GestureLogEntry {
    id: string;
    gesture: string;
    hand: "LEFT" | "RIGHT";
    time: string;
}

export default function GestureHistory() {
    const { leftGesture, rightGesture } = useStore();
    const [history, setHistory] = useState<GestureLogEntry[]>([]);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        // Log when gestures change
        const addToHistory = (gesture: string, hand: "LEFT" | "RIGHT") => {
            if (gesture === "IDLE") return;

            const entry: GestureLogEntry = {
                id: Date.now().toString() + hand,
                gesture,
                hand,
                time: new Date().toLocaleTimeString()
            };

            setHistory(prev => [entry, ...prev].slice(0, 10)); // Keep last 10
        };

        if (leftGesture !== "IDLE") {
            addToHistory(leftGesture, "LEFT");
        }
        if (rightGesture !== "IDLE") {
            addToHistory(rightGesture, "RIGHT");
        }
    }, [leftGesture, rightGesture]);

    return (
        <div className="fixed top-24 right-6 z-50 w-72 bg-black/80 border border-purple-500/50 rounded-lg backdrop-blur-md">
            {/* Header */}
            <div
                onClick={() => setIsMinimized(!isMinimized)}
                className="flex items-center justify-between p-3 border-b border-purple-500/30 cursor-pointer hover:bg-purple-500/10 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-purple-400 font-mono text-xs font-bold">GESTURE HISTORY</span>
                </div>
                <span className="text-purple-400 text-xs">{isMinimized ? '▼' : '▲'}</span>
            </div>

            {/* Content */}
            <AnimatePresence>
                {!isMinimized && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-3 max-h-64 overflow-y-auto space-y-2">
                            {history.length === 0 ? (
                                <p className="text-gray-500 text-xs text-center py-4">No gestures detected yet</p>
                            ) : (
                                history.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center justify-between bg-purple-900/20 rounded px-2 py-1.5 text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${entry.hand === "LEFT" ? "bg-blue-500/30 text-blue-300" : "bg-red-500/30 text-red-300"
                                                }`}>
                                                {entry.hand}
                                            </span>
                                            <span className="text-white font-mono">{entry.gesture}</span>
                                        </div>
                                        <span className="text-gray-500 font-mono text-[10px]">{entry.time}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
