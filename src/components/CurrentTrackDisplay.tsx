"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

// Helper to get cookie
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

export default function CurrentTrackDisplay() {
    const [track, setTrack] = useState<TrackInfo | null>(null);
    const [error, setError] = useState<string>("");
    const [localProgress, setLocalProgress] = useState(0);

    useEffect(() => {
        let isMuted = false;

        const fetchCurrentTrack = async () => {
            if (isMuted) return;
            const token = getCookie('spotify_access_token');
            if (!token) return;

            try {
                // Add timestamp to prevent caching
                const response = await fetch(`https://api.spotify.com/v1/me/player/currently-playing?timestamp=${Date.now()}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 204) {
                    return;
                }

                if (!response.ok) {
                    setError("");
                    return;
                }

                const data = await response.json();
                if (data && data.item) {
                    // Check if track actually changed to log it
                    setTrack(prev => {
                        const newArt = data.item.album.images[0]?.url || '';
                        if (prev && prev.albumArt !== newArt) {
                            console.log("Track changed, new art:", newArt);
                        }
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
                }
            } catch (e) {
                // Silently fail
            }
        };

        // Fetch immediately
        fetchCurrentTrack();

        // Fetch updates every 2 seconds (faster polling)
        const fetchInterval = setInterval(fetchCurrentTrack, 2000);

        // Listen for OPTIMISTIC updates from GestureController
        const handleOptimisticUpdate = (e: Event) => {
            const action = (e as CustomEvent).detail.action;
            console.log(`Optimistic Update: ${action}`);

            // 1. Instant UI Feedback (Lie to the user temporarily)
            setTrack(prev => {
                if (!prev) return prev;
                if (action === 'pause') return { ...prev, isPlaying: false };
                if (action === 'play') return { ...prev, isPlaying: true };
                if (action === 'next' || action === 'previous') return { ...prev, progress: 0 }; // Reset bar
                return prev;
            });

            // 2. Poll aggressively to get the REAL data (Sync)
            setTimeout(fetchCurrentTrack, 100);
            setTimeout(fetchCurrentTrack, 500);
            setTimeout(fetchCurrentTrack, 1000);
            setTimeout(fetchCurrentTrack, 2000);
            setTimeout(fetchCurrentTrack, 3500);
        };
        window.addEventListener('spotifyOptimisticAction', handleOptimisticUpdate);

        // Local progress timer for smooth UI
        const progressInterval = setInterval(() => {
            setTrack((current) => {
                if (!current || !current.isPlaying) return current;
                // Increment if playing
                const newProgress = Math.min(current.progress + 1000, current.duration);
                return { ...current, progress: newProgress };
            });
        }, 1000);

        return () => {
            isMuted = true; // effective unmount cleanup
            clearInterval(fetchInterval);
            clearInterval(progressInterval);
            window.removeEventListener('spotifyOptimisticAction', handleOptimisticUpdate);
        };
    }, []);

    if (!track && !error) return null;

    const progressPercent = track ? (track.progress / track.duration) * 100 : 0;

    return (
        <AnimatePresence>
            {track && (
                <motion.div
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    className="fixed top-32 left-8 z-50 font-sans"
                >
                    {/* Main Card */}
                    <div className="bg-black/60 backdrop-blur-xl border border-green-500/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(34,197,94,0.15)] flex gap-6 items-center w-[32rem]">

                        {/* Large Album Art - Sharp & Big */}
                        <div className="relative flex-shrink-0 group">
                            <motion.div
                                className="w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                <img
                                    key={track.albumArt} // Force re-render on change
                                    src={track.albumArt}
                                    alt={track.album}
                                    className="w-full h-full object-cover"
                                />
                                {track.isPlaying && (
                                    <div className="absolute inset-0 bg-black/10 transition-colors" />
                                )}
                            </motion.div>


                        </div>

                        {/* Content Section */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center h-full gap-3">

                            {/* Text Info */}
                            <div>
                                <h3 className="text-white font-bold text-2xl truncate leading-tight tracking-tight mb-1">{track.name}</h3>
                                <p className="text-gray-400 text-sm truncate font-medium">{track.artist}</p>
                                <p className="text-gray-600 text-xs truncate mt-0.5 uppercase tracking-wide">{track.album}</p>
                            </div>

                            {/* Progress & Time */}
                            <div className="w-full space-y-1.5">
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-green-500 rounded-full relative shadow-[0_0_10px_#4ade80]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ ease: "linear", duration: 0.5 }}
                                    ></motion.div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500 font-mono font-bold tracking-wider">
                                    <span>{formatTime(track.progress)}</span>
                                    <span>{formatTime(track.duration)}</span>
                                </div>
                            </div>

                            {/* Neat Control Buttons */}
                            <div className="flex items-center gap-4 mt-1">
                                <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-all text-white/70 hover:text-white">
                                    <SkipBack size={20} fill="currentColor" />
                                </button>

                                <button className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 ${track.isPlaying ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-white text-black hover:bg-gray-200'}`}>
                                    {track.isPlaying ? (
                                        <Pause size={24} fill="currentColor" />
                                    ) : (
                                        <Play size={24} fill="currentColor" />
                                    )}
                                </button>

                                <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-all text-white/70 hover:text-white">
                                    <SkipForward size={20} fill="currentColor" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
