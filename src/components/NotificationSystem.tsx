"use client";

import { useStore } from "@/store/useStore";
import { AnimatePresence, motion } from "framer-motion";

export default function NotificationSystem() {
    const { notifications } = useStore();

    return (
        <div className="fixed top-20 right-10 z-[100] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {notifications.map((notif) => (
                    <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        className={`
              px-4 py-3 rounded-r-lg border-l-4 shadow-lg backdrop-blur-md
              bg-black/80 font-mono text-sm tracking-wider w-64
              ${notif.type === "success" ? "border-green-500 text-green-100" : ""}
              ${notif.type === "warning" ? "border-red-500 text-red-100" : ""}
              ${notif.type === "info" ? "border-cyan-500 text-cyan-100" : ""}
            `}
                    >
                        <div className="flex justify-between items-center">
                            <span>{notif.message}</span>
                        </div>
                        {/* Progress bar effect could go here */}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
