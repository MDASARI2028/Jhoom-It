import GestureController from "@/components/GestureController";
import HandUI from "@/components/HandUI";
import NotificationSystem from "@/components/NotificationSystem";

import CurrentTrackDisplay from "@/components/CurrentTrackDisplay";
import GestureHistory from "@/components/GestureHistory";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center">

      { }
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        <CurrentTrackDisplay />
      </div>



      { }
      <div className="fixed top-6 right-6 w-56 h-40 rounded-2xl overflow-hidden border border-green-500/20 shadow-[0_0_30px_rgba(30,215,96,0.2)] z-40 bg-black group">
        <GestureController minimized={true} className="w-full h-full" />
        { }
        <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-green-400 font-mono opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">
          CAMERA FEED
        </div>
      </div>

      { }
      <HandUI />
      <NotificationSystem />

      { }
      <div className="fixed bottom-6 left-6 z-30 flex flex-col gap-4">

        { }
        <div className="bg-black/80 backdrop-blur-md border border-green-500/30 rounded-xl p-4 text-green-100 font-mono text-xs tracking-wider shadow-[0_0_20px_rgba(30,215,96,0.1)] w-64">
          <h3 className="text-green-400 font-bold mb-3 border-b border-green-500/30 pb-1">COMMANDS</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-3">
              <span className="text-xl">🖐️</span>
              <div><span className="text-green-300 font-bold">PALM</span> <span className="text-[10px] opacity-70">PLAY/PAUSE</span></div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-xl">✌️</span>
              <div><span className="text-green-300 font-bold">VICTORY</span> <span className="text-[10px] opacity-70">NEXT</span></div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-xl">👆</span>
              <div><span className="text-green-300 font-bold">POINT</span> <span className="text-[10px] opacity-70">PREV</span></div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-xl">👍</span>
              <div><span className="text-green-300 font-bold">THUMB UP</span> <span className="text-[10px] opacity-70">VOL UP</span></div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-xl">👎</span>
              <div><span className="text-green-300 font-bold">THUMB DOWN</span> <span className="text-[10px] opacity-70">VOL DOWN</span></div>
            </li>
          </ul>
        </div>

        { }

      </div>

      { }
      <div className="absolute top-8 left-8 z-50 pointer-events-none">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-white tracking-tighter font-mono italic opacity-90">
          JHOOM IT
        </h1>
      </div>

    </main>
  );
}
