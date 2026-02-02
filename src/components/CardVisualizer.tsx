"use client";

import { useEffect, useRef } from "react";

export default function CardVisualizer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const initAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContext();
                analyserRef.current = audioContextRef.current.createAnalyser();

                sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                sourceRef.current.connect(analyserRef.current);

                // High resolution for "many many bars"
                analyserRef.current.fftSize = 1024;
                analyserRef.current.smoothingTimeConstant = 0.5;

                draw();
            } catch (err) {
                console.warn("Microphone access denied:", err);
            }
        };

        const draw = () => {
            if (!canvasRef.current || !analyserRef.current) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Resize canvas to match the container
            if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
            }

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const w = canvas.width;
            const h = canvas.height;
            const centerX = w / 2;
            const centerY = h / 2;

            // Inset defines the "surface" of the card
            const insetX = 50;
            const insetY = 50;
            const innerW = w - (insetX * 2);
            const innerH = h - (insetY * 2);
            const borderRadius = 40;

            // "Many many bars" -> High density
            const barCount = 300;
            const totalPerimeter = (innerW + innerH) * 2;
            const step = Math.floor(bufferLength / barCount) || 1;

            ctx.lineCap = "round";

            // Loop twice to create a layered wave effect? 
            // No, single high-density pass is cleaner for "waves"

            for (let i = 0; i < barCount; i++) {
                const value = dataArray[i * step] || 0;

                // WAVELIKE SCALING
                // Square scale makes quiet sounds smaller, loud sounds bigger -> punchy
                const normalized = value / 255;
                const barLen = Math.pow(normalized, 1.5) * 100;

                // Position along rounded perimeter
                const t = i / barCount;
                const pos = getPointOnRoundedRect(centerX, centerY, innerW, innerH, borderRadius, t * totalPerimeter);

                // Normal Vector (Outwards)
                let angle = 0;

                // Determine Normal based on section
                // Top Edge
                if (pos.y <= centerY - innerH / 2 + 1) angle = -Math.PI / 2;
                // Bottom Edge
                else if (pos.y >= centerY + innerH / 2 - 1) angle = Math.PI / 2;
                // Left Edge
                else if (pos.x <= centerX - innerW / 2 + 1) angle = Math.PI;
                // Right Edge
                else if (pos.x >= centerX + innerW / 2 - 1) angle = 0;
                // Corners - calculate explicitly from center of corner arc
                else {
                    // This creates radial spread on corners
                    if (pos.x > centerX && pos.y < centerY) angle = Math.atan2(pos.y - (centerY - innerH / 2 + borderRadius), pos.x - (centerX + innerW / 2 - borderRadius)); // TR
                    else if (pos.x > centerX && pos.y > centerY) angle = Math.atan2(pos.y - (centerY + innerH / 2 - borderRadius), pos.x - (centerX + innerW / 2 - borderRadius)); // BR
                    else if (pos.x < centerX && pos.y > centerY) angle = Math.atan2(pos.y - (centerY + innerH / 2 - borderRadius), pos.x - (centerX - innerW / 2 + borderRadius)); // BL
                    else if (pos.x < centerX && pos.y < centerY) angle = Math.atan2(pos.y - (centerY - innerH / 2 + borderRadius), pos.x - (centerX - innerW / 2 + borderRadius)); // TL
                }

                const x2 = pos.x + Math.cos(angle) * (barLen + 2); // +2 min length
                const y2 = pos.y + Math.sin(angle) * (barLen + 2);

                // WAVE COLOR
                // Use slightly varied width for "messy wave" feel, or uniform for clean wave
                // User said "looks almost like waves". 
                // Using thin lines closely packed creates a wave texture.

                ctx.lineWidth = 3; // Thicker lines merge better into a wave

                const hue = 120 + (normalized * 50); // Green -> Teal
                const alpha = 0.3 + (normalized * 0.7);

                ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        function getPointOnRoundedRect(cx: number, cy: number, w: number, h: number, r: number, dist: number) {
            const halfW = w / 2;
            const halfH = h / 2;

            // Perimeter walk logic (Top center -> Clockwise)

            // Top (Right half)
            if (dist <= halfW - r) return { x: cx + dist, y: cy - halfH };
            dist -= (halfW - r);
            // TR Corner
            const quarterCirc = 0.5 * Math.PI * r;
            if (dist <= quarterCirc) {
                const a = -Math.PI / 2 + (dist / quarterCirc) * (Math.PI / 2);
                return { x: cx + halfW - r + Math.cos(a) * r, y: cy - halfH + r + Math.sin(a) * r };
            }
            dist -= quarterCirc;
            // Right Edge
            if (dist <= h - 2 * r) return { x: cx + halfW, y: cy - halfH + r + dist };
            dist -= (h - 2 * r);
            // BR Corner
            if (dist <= quarterCirc) {
                const a = 0 + (dist / quarterCirc) * (Math.PI / 2);
                return { x: cx + halfW - r + Math.cos(a) * r, y: cy + halfH - r + Math.sin(a) * r };
            }
            dist -= quarterCirc;
            // Bottom Edge
            if (dist <= w - 2 * r) return { x: cx + halfW - r - dist, y: cy + halfH };
            dist -= (w - 2 * r);
            // BL Corner
            if (dist <= quarterCirc) {
                const a = Math.PI / 2 + (dist / quarterCirc) * (Math.PI / 2);
                return { x: cx - halfW + r + Math.cos(a) * r, y: cy + halfH - r + Math.sin(a) * r };
            }
            dist -= quarterCirc;
            // Left Edge
            if (dist <= h - 2 * r) return { x: cx - halfW, y: cy + halfH - r - dist };
            dist -= (h - 2 * r);
            // TL Corner
            if (dist <= quarterCirc) {
                const a = Math.PI + (dist / quarterCirc) * (Math.PI / 2);
                return { x: cx - halfW + r + Math.cos(a) * r, y: cy - halfH + r + Math.sin(a) * r };
            }
            dist -= quarterCirc;
            // Top (Left half)
            return { x: cx - halfW + r + dist, y: cy - halfH };
        }

        const handleStart = () => { if (!audioContextRef.current) initAudio(); };
        window.addEventListener('click', handleStart);
        window.addEventListener('keydown', handleStart);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            window.removeEventListener('click', handleStart);
            window.removeEventListener('keydown', handleStart);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute -top-[50px] -left-[50px] -right-[50px] -bottom-[50px] w-[calc(100%+100px)] h-[calc(100%+100px)] pointer-events-none z-0"
        />
    );
}
