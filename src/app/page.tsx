// src/app/page.tsx
import GestureController from "@/components/GestureController";
import HandUI from "@/components/HandUI";
import NotificationSystem from "@/components/NotificationSystem";
import TestingPanel from "@/components/TestingPanel";
import CurrentTrackDisplay from "@/components/CurrentTrackDisplay";
import GestureHistory from "@/components/GestureHistory";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Background: Webcam Feed & Local Gesture Processing */}
      <GestureController />

      {/* Hand Visuals Layer */}
      <HandUI />
      <NotificationSystem />
      <TestingPanel />
      <CurrentTrackDisplay />

      {/* Overlay UI */}
      <div className="absolute top-6 left-6 z-50 pointer-events-none">
        <h1 className="text-2xl font-bold text-white tracking-widest font-mono">
          JHOOM IT
        </h1>
        <div className="flex items-center gap-2 mt-1 opacity-70">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-green-400 text-xs tracking-[0.3em] font-bold">
            SYSTEM ONLINE
          </p>
        </div>
      </div>

    </main>
  );
}
