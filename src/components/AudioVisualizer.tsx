"use client";

import { useEffect, useRef } from "react";

export default function AudioVisualizer() {
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

                // FASTER RESPONSE & HIGH RES
                analyserRef.current.fftSize = 2048; // High resolution
                analyserRef.current.smoothingTimeConstant = 0.6; // Snappier response (was 0.8)

                draw();
            } catch (err) {
                console.warn("Microphone access denied or not available:", err);
            }
        };

        const draw = () => {
            if (!canvasRef.current || !analyserRef.current) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            analyserRef.current.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // TIGHT FIT ALGORITHM
            // Card is approx 896px (max-w-4xl) wide.
            // Let's make the visualizer hug it closely.
            const rectWidth = 900;
            const rectHeight = 350;
            const borderRadius = 40;

            // Dynamic Glow 
            const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
            const glowOpacity = 0.05 + (bass / 255) * 0.2;
            ctx.shadowBlur = 10 + (bass / 255) * 30; // Tighter shadow
            ctx.shadowColor = `rgba(34, 197, 94, ${glowOpacity})`;

            ctx.lineWidth = 2; // Thinner lines for "many bars" look
            ctx.lineCap = "round";

            const barCount = 280; // "Keep many bars" -> increased from 120
            const totalPerimeter = (rectWidth + rectHeight) * 2;
            const step = Math.floor((bufferLength * 0.7) / barCount) || 1; // Use lower 70% of freq spectrum (more active)

            for (let i = 0; i < barCount; i++) {
                const value = dataArray[i * step] || 0;

                // HIGH SENSITIVITY
                // Even small inputs (50/255) should show visible bars
                // value/255 typically 0.0 - 1.0
                let barHeight = (value / 255) * 100;

                // Noise gate to suppress silence line
                if (value < 10) barHeight = 2;

                // Position along perimeter
                const t = i / barCount;
                const pos = getPointOnRoundedRect(centerX, centerY, rectWidth, rectHeight, borderRadius, t * totalPerimeter);

                const angle = Math.atan2(pos.y - centerY, pos.x - centerX);

                // Draw OUTWARDS from border
                const x2 = pos.x + Math.cos(angle) * (barHeight + 2);
                const y2 = pos.y + Math.sin(angle) * (barHeight + 2);

                const hue = 120 + (value / 255) * 40; // 120-160 (Green to Teal)
                const lightness = 50 + (value / 255) * 20;

                ctx.strokeStyle = `hsla(${hue}, 100%, ${lightness}%, ${value > 10 ? 0.8 : 0.2})`;

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

            // Start Top-Center -> Clockwise

            // Top Edge (Right half)
            if (dist <= halfW - r) return { x: cx + dist, y: cy - halfH };
            dist -= (halfW - r);

            // Top-Right Corner
            if (dist <= (Math.PI * r / 2)) {
                const angle = -Math.PI / 2 + (dist / (Math.PI * r / 2)) * (Math.PI / 2);
                return { x: cx + halfW - r + Math.cos(angle) * r, y: cy - halfH + r + Math.sin(angle) * r };
            }
            dist -= (Math.PI * r / 2);

            // Right Edge
            if (dist <= h - 2 * r) return { x: cx + halfW, y: cy - halfH + r + dist };
            dist -= (h - 2 * r);

            // Bottom-Right Corner
            if (dist <= (Math.PI * r / 2)) {
                const angle = 0 + (dist / (Math.PI * r / 2)) * (Math.PI / 2);
                return { x: cx + halfW - r + Math.cos(angle) * r, y: cy + halfH - r + Math.sin(angle) * r };
            }
            dist -= (Math.PI * r / 2);

            // Bottom Edge
            if (dist <= w - 2 * r) return { x: cx + halfW - r - dist, y: cy + halfH };
            dist -= (w - 2 * r);

            // Bottom-Left Corner
            if (dist <= (Math.PI * r / 2)) {
                const angle = Math.PI / 2 + (dist / (Math.PI * r / 2)) * (Math.PI / 2);
                return { x: cx - halfW + r + Math.cos(angle) * r, y: cy + halfH - r + Math.sin(angle) * r };
            }
            dist -= (Math.PI * r / 2);

            // Left Edge
            if (dist <= h - 2 * r) return { x: cx - halfW, y: cy + halfH - r - dist };
            dist -= (h - 2 * r);

            // Top-Left Corner
            if (dist <= (Math.PI * r / 2)) {
                const angle = Math.PI + (dist / (Math.PI * r / 2)) * (Math.PI / 2);
                return { x: cx - halfW + r + Math.cos(angle) * r, y: cy - halfH + r + Math.sin(angle) * r };
            }
            dist -= (Math.PI * r / 2);

            // Top Edge (Left half)
            return { x: cx - halfW + r + dist, y: cy - halfH };
        }

        const resize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', resize);
        resize();

        const handleStart = () => {
            if (!audioContextRef.current) initAudio();
        };
        window.addEventListener('click', handleStart);
        window.addEventListener('keydown', handleStart);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            window.removeEventListener('resize', resize);
            window.removeEventListener('click', handleStart);
            window.removeEventListener('keydown', handleStart);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0 opacity-80"
        />
    );
}
