
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useStore, GestureType } from "@/store/useStore";
import {
    playSelectSound,
    playHoverSound,
    playEngageSound,
} from "@/utils/audio";
import type { Results as HandsResults } from "@mediapipe/hands";


function getCookie(name: string) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
}

import { twMerge } from "tailwind-merge";

interface GestureControllerProps {
    minimized?: boolean;
    className?: string;
}

export default React.memo(function GestureController({ minimized = false, className = "" }: GestureControllerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [gestureFlash, setGestureFlash] = useState(false);
    const [activeDevice, setActiveDevice] = useState<string>("Searching for device...");
    const [localBackendConnected, setLocalBackendConnected] = useState(false);




    useEffect(() => {
        const checkLocalBackend = async () => {
            try {
                const res = await fetch('http://localhost:5000/health');
                if (res.ok) {
                    setLocalBackendConnected(true);
                    useStore.getState().addNotification("Local Control Active", "success");
                }
            } catch (e) {
                console.warn("Local backend not found");
                setLocalBackendConnected(false);
            }
        };
        checkLocalBackend();
        const interval = setInterval(checkLocalBackend, 10000); 
        return () => clearInterval(interval);
    }, []);


    const prevGestureLeft = useRef<GestureType>("IDLE");
    const prevGestureRight = useRef<GestureType>("IDLE");
    const lastHandUIUpdate = useRef<number>(0);
    const handUIThrottle = 50;
    const isMounted = useRef(true);


    const actionCooldown = useRef<number>(0);

    useEffect(() => {

        const checkAuth = () => {
            const token = getCookie('spotify_access_token');
            const hasToken = !!token;
            console.log('Auth Check - Token exists:', hasToken);
            if (hasToken !== isAuthenticated) {
                setIsAuthenticated(hasToken);
                if (hasToken) {
                    useStore.getState().addNotification("Connected to Spotify!", "success");
                }
            }
        };

        checkAuth(); 
        const interval = setInterval(checkAuth, 2000); 

        return () => clearInterval(interval);
    }, [isAuthenticated]);


    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchDevice = async () => {
            const token = getCookie('spotify_access_token');
            if (!token) return;

            try {
                const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                const active = data.devices?.find((d: any) => d.is_active);

                if (active) {
                    setActiveDevice(`🎵 Connected to: ${active.name}`);
                } else if (data.devices?.length > 0) {

                    setActiveDevice(`⚠️ Open Spotify on: ${data.devices[0].name}`);
                } else {
                    setActiveDevice("❌ No active Spotify devices found");
                }
            } catch (e) {
                console.error("Device fetch failed", e);
                setActiveDevice("❓ Unable to fetch device status");
            }
        };

        fetchDevice();
        const interval = setInterval(fetchDevice, 5000); 
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const callSpotify = async (endpoint: string, method: string = 'POST') => {

        const actionMap: Record<string, string> = {
            'next': 'next',
            'previous': 'previous',
            'play': 'play',
            'pause': 'pause'
        };

        const localAction = actionMap[endpoint];


        if (localAction) {
            try {
                console.log(`Trying Local Backend for: ${localAction}`);
                const localResponse = await fetch('http://localhost:5000/control', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: localAction })
                });

                if (localResponse.ok) {
                    useStore.getState().addNotification(`Local Action: ${localAction}`, "success");
                    window.dispatchEvent(new CustomEvent('spotifyApiCall', {
                        detail: { action: endpoint, status: '✓ Local Success' }
                    }));
                    return; 
                }
            } catch (e) {
                console.warn("Local backend unreachable, falling back to Spotify API...", e);

            }
        }


        const token = getCookie('spotify_access_token');
        if (!token) {
            console.error('No Spotify token found');
            useStore.getState().addNotification("Not connected to Spotify", "warning");
            return;
        }

        try {
            console.log(`Falling back to Spotify API: ${method} ${endpoint}`);
            window.dispatchEvent(new CustomEvent('spotifyApiCall', {
                detail: { action: endpoint, status: 'Calling API...' }
            }));

            const response = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();

                if (response.status === 403) {
                    useStore.getState().addNotification("API Blocked: Premium Required", "warning");
                    window.dispatchEvent(new CustomEvent('spotifyApiCall', {
                        detail: { action: endpoint, status: '403: Premium Req' }
                    }));
                } else if (response.status === 404) {
                    useStore.getState().addNotification("No active device found", "warning");
                }
            } else {
                window.dispatchEvent(new CustomEvent('spotifyApiCall', {
                    detail: { action: endpoint, status: '✓ API Success' }
                }));
            }
        } catch (e) {
            console.error("Spotify API Error", e);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        let camera: any = null;
        let hands: any = null;

        const initMediaPipe = async () => {
            if (!videoRef.current || !canvasRef.current) return;

            const videoElement = videoRef.current;
            const canvasElement = canvasRef.current;
            const canvasCtx = canvasElement.getContext("2d");

            if (!canvasCtx) return;

            const { Camera } = await import("@mediapipe/camera_utils");
            const { Hands, HAND_CONNECTIONS } = await import("@mediapipe/hands");
            const { drawConnectors, drawLandmarks } = await import(
                "@mediapipe/drawing_utils"
            );

            hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
                },
            });

            hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 0,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.6,
            });

            hands.onResults(onHandsResults);

            camera = new Camera(videoElement, {
                onFrame: async () => {
                    if (!isMounted.current) return;
                    if (hands) await hands.send({ image: videoElement });
                },
                width: 640,  
                height: 480, 
            });

            camera.start();


            const gestureDurationMap = {
                left: { gesture: "IDLE" as GestureType, frames: 0 },
                right: { gesture: "IDLE" as GestureType, frames: 0 }
            };
            const REQUIRED_HOLD_DURATION = 8; 
            const COOLDOWN_MS = 2000; 

            function onHandsResults(results: HandsResults) {
                if (!isMounted.current || !canvasCtx) return;
                canvasCtx.save();
                canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);


                canvasCtx.drawImage(
                    results.image,
                    0,
                    0,
                    canvasElement.width,
                    canvasElement.height
                );

                let leftHand = null;
                let rightHand = null;
                let leftGesture: GestureType = "IDLE";
                let rightGesture: GestureType = "IDLE";

                const {
                    setHands,
                    setGestures,
                    updateHandUI
                } = useStore.getState();

                if (results.multiHandLandmarks) {
                    for (const [
                        index,
                        landmarks,
                    ] of results.multiHandLandmarks.entries()) {

                        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                            color: "rgba(30, 215, 96, 0.6)",
                            lineWidth: 2,
                        });
                        drawLandmarks(canvasCtx, landmarks, {
                            color: "rgba(255, 255, 255, 0.8)",
                            fillColor: "rgba(30, 215, 96, 0.8)",
                            radius: 2,
                            lineWidth: 1,
                        });

                        const label = results.multiHandedness[index]?.label;
                        const rawGesture = detectGesture(landmarks);
                        const palmX = landmarks[9].x;
                        const palmY = landmarks[9].y;



                        let stableGesture = "IDLE" as GestureType;

                        if (label === "Left") {
                            leftHand = landmarks;


                            if (gestureDurationMap.left.gesture === rawGesture) {
                                gestureDurationMap.left.frames++;
                            } else {
                                gestureDurationMap.left.gesture = rawGesture;
                                gestureDurationMap.left.frames = 0;
                            }


                            if (gestureDurationMap.left.frames >= REQUIRED_HOLD_DURATION) {
                                stableGesture = rawGesture;
                            } else {
                                stableGesture = "IDLE"; 
                            }
                            leftGesture = stableGesture;

                            const now = Date.now();
                            if (now - lastHandUIUpdate.current > handUIThrottle) {

                                updateHandUI("left", { visible: true, x: palmX, y: palmY, gesture: rawGesture });
                                lastHandUIUpdate.current = now;
                            }
                        }

                        if (label === "Right") {
                            rightHand = landmarks;

                            if (gestureDurationMap.right.gesture === rawGesture) {
                                gestureDurationMap.right.frames++;
                            } else {
                                gestureDurationMap.right.gesture = rawGesture;
                                gestureDurationMap.right.frames = 0;
                            }

                            if (gestureDurationMap.right.frames >= REQUIRED_HOLD_DURATION) {
                                stableGesture = rawGesture;
                            } else {
                                stableGesture = "IDLE";
                            }
                            rightGesture = stableGesture;

                            const now = Date.now();
                            if (now - lastHandUIUpdate.current > handUIThrottle) {
                                updateHandUI("right", { visible: true, x: palmX, y: palmY, gesture: rawGesture });
                                lastHandUIUpdate.current = now;
                            }
                        }
                    }
                }

                if (!leftHand) {
                    updateHandUI("left", { visible: false });
                    gestureDurationMap.left.frames = 0;
                }
                if (!rightHand) {
                    updateHandUI("right", { visible: false });
                    gestureDurationMap.right.frames = 0;
                }

                setHands(leftHand, rightHand);
                setGestures(leftGesture, rightGesture);



                handleSpotifyActions(leftGesture, rightGesture);

                prevGestureLeft.current = leftGesture;
                prevGestureRight.current = rightGesture;

                canvasCtx.restore();
            }

            function handleSpotifyActions(left: GestureType, right: GestureType) {
                const now = Date.now();
                if (now - actionCooldown.current < COOLDOWN_MS) return; 


                const activeGesture = right !== "IDLE" ? right : left;
                if (activeGesture === "IDLE" || activeGesture === "PINCH") return;

                const triggerUpdate = (action: string) => {

                    window.dispatchEvent(new CustomEvent('spotifyOptimisticAction', { detail: { action } }));
                };

                console.log(`ACTION TRIGGERED: ${activeGesture}`); 

                if (activeGesture === "VICTORY") {

                    callSpotify('next');
                    triggerUpdate('next');
                    playHoverSound();
                    useStore.getState().addNotification("Skipping Track", "success");
                    setGestureFlash(true);
                    setTimeout(() => setGestureFlash(false), 200);
                    actionCooldown.current = now;
                } else if (activeGesture === "GRAB") {

                    callSpotify('pause', 'PUT');
                    triggerUpdate('pause');
                    playEngageSound();
                    useStore.getState().addNotification("Pausing", "warning");
                    setGestureFlash(true);
                    setTimeout(() => setGestureFlash(false), 200);
                    actionCooldown.current = now;
                } else if (activeGesture === "PALM_OPEN") {

                    callSpotify('play', 'PUT');
                    triggerUpdate('play');
                    playSelectSound();
                    useStore.getState().addNotification("Resuming", "success");
                    setGestureFlash(true);
                    setTimeout(() => setGestureFlash(false), 200);
                    actionCooldown.current = now;
                } else if (activeGesture === "POINT") {

                    callSpotify('previous');
                    triggerUpdate('previous');
                    playHoverSound();
                    useStore.getState().addNotification("Previous Track", "info");
                    setGestureFlash(true);
                    setTimeout(() => setGestureFlash(false), 200);
                    actionCooldown.current = now;
                }
            }

            function detectGesture(landmarks: any[]): GestureType {
                const thumbTip = landmarks[4];
                const indexTip = landmarks[8];
                const middleTip = landmarks[12];
                const ringTip = landmarks[16];
                const pinkyTip = landmarks[20];
                const wrist = landmarks[0];


                const isExtended = (tip: any, pipIdx: number) => {
                    const pip = landmarks[pipIdx];
                    const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
                    const distPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);


                    return distTip > (distPip * 1.2);
                };

                const indexExt = isExtended(indexTip, 6);
                const middleExt = isExtended(middleTip, 10);
                const ringExt = isExtended(ringTip, 14);
                const pinkyExt = isExtended(pinkyTip, 18);


                const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

                if (pinchDist < 0.05) return "PINCH";


                if (indexExt && middleExt && ringExt && pinkyExt) return "PALM_OPEN"; 
                if (!indexExt && !middleExt && !ringExt && !pinkyExt) return "GRAB";  
                if (indexExt && !middleExt && !ringExt && !pinkyExt) return "POINT";  
                if (indexExt && middleExt && !ringExt && !pinkyExt) return "VICTORY"; 


                if (indexExt && middleExt && !ringExt && !pinkyExt) return "VICTORY";

                return "IDLE";
            }
        };

        initMediaPipe();

        return () => {
            isMounted.current = false;
            if (camera) (camera as any).stop();
            if (hands) (hands as any).close();
        };
    }, []);

    return (
        <div className={twMerge("relative z-0 bg-black overflow-hidden", className)}>
            {}
            {gestureFlash && (
                <div className="absolute inset-0 bg-green-500/20 pointer-events-none z-10 animate-pulse" />
            )}

            <video ref={videoRef} className="hidden" playsInline />
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-60"
                width={640}  
                height={480} 
            />

            {}
            {!minimized && !isAuthenticated && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-4">
                    <a href="/api/auth/login" className="px-8 py-4 bg-[#1DB954] text-black font-bold text-xl rounded-full hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_30px_#1DB954]">
                        <span>CONNECT SPOTIFY</span>
                    </a>
                    <button
                        onClick={() => {
                            const token = getCookie('spotify_access_token');
                            console.log('Manual cookie check:', { token: token ? 'EXISTS' : 'MISSING', value: token });
                            alert(token ? `Token exists: ${token.substring(0, 20)}...` : 'No token found in cookies');
                        }}
                        className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded border border-gray-600 hover:bg-gray-700"
                    >
                        Debug: Check Cookies
                    </button>
                </div>
            )}

            {}
            {!minimized && isAuthenticated && (
                <div className="absolute top-6 right-6 z-50 max-w-xs">
                    <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 backdrop-blur-md">
                        <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>SPOTIFY CONNECTED</span>
                        </div>
                        <p className="text-xs text-white/70 mt-1 font-mono">{activeDevice}</p>
                        <p className="text-xs text-yellow-400 mt-1 font-mono font-bold">⚠️ KEEP THIS TAB OPEN!</p>
                        <div className="mt-2 pt-2 border-t border-green-500/30">
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${localBackendConnected ? 'bg-green-400' : 'bg-red-500'}`}></div>
                                <span className={`text-[10px] font-mono ${localBackendConnected ? 'text-green-400' : 'text-red-400'}`}>
                                    {localBackendConnected ? 'LOCAL CONTROL: ONLINE' : 'LOCAL CONTROL: OFFLINE'}
                                </span>
                            </div>
                            {!localBackendConnected && <p className="text-[9px] text-white/50 mt-0.5">Run 'python local_control/server.py'</p>}
                        </div>
                        <div className="mt-2 pt-2 border-t border-green-500/30">
                            <p className="text-xs text-red-400 font-mono font-bold">⚠️ PREMIUM REQUIRED</p>
                            <p className="text-[10px] text-white/60 mt-1">Spotify API needs Premium subscription for playback control</p>
                        </div>
                    </div>
                </div>
            )}

            {}
            {!minimized && (
                <div className="absolute bottom-10 left-10 z-50 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md border border-green-500/30 rounded-xl p-4 text-green-100 font-mono text-xs tracking-wider shadow-[0_0_20px_rgba(30,215,96,0.1)]">
                        <h3 className="text-green-400 font-bold mb-3 border-b border-green-500/30 pb-1">SPOTIFY COMMANDS</h3>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-3">
                                <span className="text-xl">✊</span>
                                <div>
                                    <span className="text-green-300 font-bold">GRAB</span>
                                    <p className="text-[10px] opacity-70">PAUSE</p>
                                </div>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-xl">🖐️</span>
                                <div>
                                    <span className="text-green-300 font-bold">PALM OPEN</span>
                                    <p className="text-[10px] opacity-70">PLAY</p>
                                </div>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-xl">✌️</span>
                                <div>
                                    <span className="text-green-300 font-bold">VICTORY</span>
                                    <p className="text-[10px] opacity-70">NEXT TRACK</p>
                                </div>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-xl">👆</span>
                                <div>
                                    <span className="text-green-300 font-bold">POINT</span>
                                    <p className="text-[10px] opacity-70">PREVIOUS</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
});
