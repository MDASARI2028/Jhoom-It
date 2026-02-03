"use client";

import { useStore } from "@/store/useStore";
import { AnimatePresence, motion } from "framer-motion";

export default function NotificationSystem() {
    const { notifications } = useStore();

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none items-end min-h-[60px]">
            <AnimatePresence mode="wait">
                {notifications.map((notif) => (
                    <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: 20, y: 20 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        className={`
              px-4 py-3 rounded-lg border-l-4 shadow-lg backdrop-blur-md
              bg-black/90 font-mono text-sm tracking-wider w-64
              ${notif.type === "success" ? "border-green-500 text-green-100" : ""}
              ${notif.type === "warning" ? "border-red-500 text-red-100" : ""}
              ${notif.type === "info" ? "border-cyan-500 text-cyan-100" : ""}
            `}
                    >
                        <div className="flex justify-between items-center">
                            <span>{notif.message}</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
