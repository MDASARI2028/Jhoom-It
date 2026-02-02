"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";


function getCookie(name: string) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
}

interface TrackInfo {
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    isPlaying: boolean;
    progress: number;
    duration: number;
}

import CardVisualizer from "./CardVisualizer";

export default function CurrentTrackDisplay() {
    const [track, setTrack] = useState<TrackInfo | null>(null);
    const [error, setError] = useState<string>("");

    const [localProgress, setLocalProgress] = useState(0);

    const [debugInfo, setDebugInfo] = useState({ token: "Checking...", status: "Init", lastUpdate: "-" });

    useEffect(() => {
        let isMuted = false;

        const fetchCurrentTrack = async () => {
            if (isMuted) return;
            const token = getCookie('spotify_access_token');

            setDebugInfo(prev => ({ ...prev, token: token ? "OK" : "MISSING " + (document.cookie.length) }));

            if (!token) {
                setError("No Spotify Token Found. Please Log In.");
                return;
            }

            try {

                const response = await fetch(`https://api.spotify.com/v1/me/player/currently-playing?timestamp=${Date.now()}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                setDebugInfo(prev => ({ ...prev, status: `HTTP ${response.status}`, lastUpdate: new Date().toLocaleTimeString() }));

                if (response.status === 204) {
                    setError("Spotify Open, But Not Playing.");

                    setTrack(prev => prev ? { ...prev, isPlaying: false } : null);
                    return;
                }

                if (response.status === 401) {
                    setError("Token Expired. Please Re-login.");
                    return;
                }

                if (!response.ok) {
                    setError(`Spotify API Error: ${response.status}`);
                    return;
                }

                const data = await response.json();
                if (data && data.item) {

                    setTrack(prev => {
                        const newArt = data.item.album.images[0]?.url || '';
                        return {
                            name: data.item.name,
                            artist: data.item.artists.map((a: any) => a.name).join(', '),
                            album: data.item.album.name,
                            albumArt: newArt,
                            isPlaying: data.is_playing,
                            progress: data.progress_ms,
                            duration: data.item.duration_ms
                        };
                    });
                    setLocalProgress(data.progress_ms);
                    setError("");
                } else {

                    setError("Unknown Content (Ad/Podcast?)");
                }
            } catch (e: any) {
                setError(`Fetch Error: ${e.message}`);
                setDebugInfo(prev => ({ ...prev, status: "Network Error" }));
            }
        };


        fetchCurrentTrack();


        const fetchInterval = setInterval(fetchCurrentTrack, 2000);


        const handleOptimisticUpdate = (e: Event) => {
            const action = (e as CustomEvent).detail.action;
            console.log(`Optimistic Update: ${action}`);
            setTrack(prev => {
                if (!prev) return prev;
                if (action === 'pause') return { ...prev, isPlaying: false };
                if (action === 'play') return { ...prev, isPlaying: true };
                return prev;
            });
            setTimeout(fetchCurrentTrack, 500);
        };
        window.addEventListener('spotifyOptimisticAction', handleOptimisticUpdate);


        const progressInterval = setInterval(() => {
            setTrack((current) => {
                if (!current || !current.isPlaying) return current;
                const newProgress = Math.min(current.progress + 1000, current.duration);
                return { ...current, progress: newProgress };
            });
        }, 1000);

        return () => {
            isMuted = true;
            clearInterval(fetchInterval);
            clearInterval(progressInterval);
            window.removeEventListener('spotifyOptimisticAction', handleOptimisticUpdate);
        };
    }, []);

    const currentTrack = track || {
        name: "No Track Detected",
        artist: error || "Waiting for Spotify...",
        album: "Status: " + debugInfo.status,
        albumArt: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/2048px-Spotify_logo_without_text.svg.png",
        isPlaying: false,
        progress: 0,
        duration: 1
    };


    const displayTrack = currentTrack;

    const progressPercent = currentTrack.duration > 0 ? (currentTrack.progress / currentTrack.duration) * 100 : 0;
    const isMissingToken = debugInfo.token.startsWith("MISSING");


    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-50 p-4 font-sans"
            >
                {}
                <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row gap-8 items-center max-w-4xl border-t border-l border-white/20 relative">

                    {}
                    <CardVisualizer />

                    {}
                    <div className="relative flex-shrink-0 group">
                        <motion.div
                            className="w-56 h-56 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-2xl border border-white/5"
                            whileHover={{ scale: 1.02 }}
                        >
                            <img
                                key={currentTrack.albumArt}
                                src={currentTrack.albumArt}
                                alt={currentTrack.album}
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    </div>

                    {}
                    <div className="flex-1 min-w-[20rem] flex flex-col justify-center gap-6">
                        {}
                        <div className="space-y-1 text-center md:text-left">
                            <h3 className="text-white font-bold text-3xl md:text-4xl truncate leading-tight tracking-tight">{currentTrack.name}</h3>
                            <p className="text-green-400 text-lg md:text-xl font-medium truncate">{currentTrack.artist}</p>
                            <p className="text-white/40 text-sm uppercase tracking-widest font-mono">{currentTrack.album}</p>
                        </div>

                        {}
                        {isMissingToken && (
                            <div className="flex justify-center md:justify-start py-2">
                                <a
                                    href="/api/auth/login"
                                    className="px-8 py-3 bg-[#1DB954] text-black font-bold text-lg rounded-full hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(30,215,96,0.3)] animate-pulse"
                                >
                                    <span>CONNECT SPOTIFY</span>
                                </a>
                            </div>
                        )}

                        {}
                        {!isMissingToken && (
                            <div className="w-full space-y-2">
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-green-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ ease: "linear", duration: 0.5 }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-white/40 font-mono font-bold tracking-wider">
                                    <span>{formatTime(currentTrack.progress)}</span>
                                    <span>{formatTime(currentTrack.duration)}</span>
                                </div>
                            </div>
                        )}

                        {}
                        {!isMissingToken && (
                            <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
                                <button className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/70 hover:text-white hover:scale-110">
                                    <SkipBack size={24} fill="currentColor" />
                                </button>

                                <button className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-105 ${displayTrack.isPlaying ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-white text-black hover:bg-gray-200'}`}>
                                    {displayTrack.isPlaying ? (
                                        <Pause size={32} fill="currentColor" />
                                    ) : (
                                        <Play size={32} fill="currentColor" className="ml-1" />
                                    )}
                                </button>

                                <button className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/70 hover:text-white hover:scale-110">
                                    <SkipForward size={24} fill="currentColor" />
                                </button>
                            </div>
                        )}

                        {}
                        <div className="text-[10px] font-mono text-white/30 text-center border-t border-white/5 pt-2 mt-2">
                            Token: {debugInfo.token} | Status: {debugInfo.status} | Last: {debugInfo.lastUpdate}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
